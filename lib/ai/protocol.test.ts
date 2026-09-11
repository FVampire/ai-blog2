import assert from "node:assert/strict";
import test from "node:test";
import {
  chatRequestSchema,
  readChatEvents,
  modelHistory,
  textContent,
} from "./protocol";
import { aiSettingSchemas, publicAIConfig, publicTools } from "./config";
import { abortable, requestScope, isReadOnlyTool } from "./abort";
import { parseSettingValue } from "../setting-values";
import { createElement } from "react";
import { codeText } from "../../components/AIChatWidget/components/CodeBlock";
import { mcpInputSchema } from "./mcp-input";

const ids = {
  requestId: "11111111-1111-4111-8111-111111111111",
  messageId: "22222222-2222-4222-8222-222222222222",
};
function stream(bytes: Uint8Array, split: number) {
  return new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(bytes.slice(0, split));
      c.enqueue(bytes.slice(split));
      c.close();
    },
  });
}

test("SSE survives every byte boundary, including UTF-8 and CRLF", async () => {
  const bytes = new TextEncoder().encode(
    ": heartbeat\r\n\r\ndata: " +
      JSON.stringify({ ...ids, type: "text-delta", text: "你好 🌍" }) +
      "\r\n\r\ndata: " +
      JSON.stringify({ ...ids, type: "done" }) +
      "\r\n\r\n",
  );
  for (let split = 0; split <= bytes.length; split++) {
    let actual = "";
    await readChatEvents(stream(bytes, split), (event) => {
      if (event.type === "text-delta") actual += event.text;
    });
    assert.equal(actual, "你好 🌍");
  }
});
test("truncated responses are not silently marked complete", async () => {
  const bytes = new TextEncoder().encode(
    "data: " +
      JSON.stringify({ ...ids, type: "text-delta", text: "partial" }) +
      "\n\n",
  );
  let actual = "";
  await assert.rejects(
    readChatEvents(stream(bytes, 10), (event) => {
      if (event.type === "text-delta") actual += event.text;
    }),
    /连接中断/,
  );
  assert.equal(actual, "partial");
});
test("malformed frames fail instead of dropping text", async () => {
  await assert.rejects(
    readChatEvents(
      stream(new TextEncoder().encode("data: broken\n\n"), 5),
      () => {},
    ),
    SyntaxError,
  );
});
test("public configuration never returns private values or arbitrary future settings", () => {
  const result = publicAIConfig({
    ai_enabled: true,
    ai_model: "model",
    ai_api_key: "private",
    ai_embedding_api_key: "private2",
    ai_assistant_system_prompt: "internal",
    ai_future_secret: "hidden",
  });
  assert.equal(result.ai_available, true);
  assert.doesNotMatch(
    JSON.stringify(result),
    /private|internal|hidden|secret|api_key/,
  );
});
test("schema rejects forged roles, excessive content and incomplete article selection", () => {
  const valid = { ...ids, messages: [{ role: "user", content: "question" }] };
  assert.equal(chatRequestSchema.safeParse(valid).success, true);
  for (const invalid of [
    { ...valid, messages: [{ role: "system", content: "override" }] },
    { ...valid, mode: "article" },
    { ...valid, mcpServers: ["unapproved"] },
    { ...valid, messages: [{ role: "user", content: "a".repeat(12001) }] },
    { ...valid, messages: [{ role: "user", content: { secret: true } }] },
  ])
    assert.equal(chatRequestSchema.safeParse(invalid).success, false);
});
test("history omits UI notices and failures while staying within request budget", () => {
  const history = modelHistory([
    { role: "assistant", content: "welcome", local: true },
    ...Array.from({ length: 50 }, (_, i) => ({
      role: (i % 2 ? "assistant" : "user") as "user" | "assistant",
      content: "a".repeat(12000),
      status: "complete",
    })),
    { role: "assistant", content: "failure", status: "error" },
    { role: "user", content: "final" },
  ]);
  assert.equal(history[history.length - 1].content, "final");
  assert.equal(history[0].role, "user");
  assert.ok(history.reduce((n, m) => n + m.content.length, 0) <= 48000);
  assert.ok(
    history.every((m) => m.content !== "welcome" && m.content !== "failure"),
  );
});
test("numeric config keeps fractional values and rejects out of range values", () => {
  assert.equal(parseSettingValue("0.3", "number"), 0.3);
  assert.equal(parseSettingValue("0", "number"), 0);
  assert.equal(aiSettingSchemas.ai_temperature.parse(0.7), 0.7);
  assert.equal(aiSettingSchemas.ai_vector_search_threshold.parse(0.3), 0.3);
  assert.equal(aiSettingSchemas.ai_max_tokens.safeParse(-1).success, false);
  assert.equal(
    aiSettingSchemas.ai_embedding_dimensions.safeParse(1536).success,
    false,
  );
});
test("highlighted code copies exact text and preserves whitespace", () => {
  assert.equal(
    codeText([
      createElement("span", {}, "const"),
      " answer = ",
      createElement("span", {}, "42"),
      ";\n",
    ]),
    "const answer = 42;\n",
  );
});
test("MCP configuration rejects invalid transports and non-string credentials", () => {
  assert.equal(
    mcpInputSchema.safeParse({
      transport: "http",
      timeout_seconds: 30,
      headers: { Authorization: "fixture" },
    }).success,
    true,
  );
  assert.equal(mcpInputSchema.safeParse({ transport: "udp" }).success, false);
  assert.equal(
    mcpInputSchema.safeParse({ timeout_seconds: -1 }).success,
    false,
  );
  assert.equal(
    mcpInputSchema.safeParse({ env_vars: { KEY: {} } }).success,
    false,
  );
});
test("public tools fail closed and require read-only metadata", () => {
  assert.deepEqual(publicTools({ ai_public_mcp_tools: "invalid" }), {});
  assert.deepEqual(publicTools({ ai_public_mcp_tools: '{"1":["search"]}' }), {
    1: ["search"],
  });
  assert.equal(isReadOnlyTool(), false);
  assert.equal(isReadOnlyTool({ annotations: { readOnlyHint: true } }), true);
  assert.equal(
    isReadOnlyTool({
      annotations: { readOnlyHint: true, destructiveHint: true },
    }),
    false,
  );
});
test("cancellation bounds a non-cooperative asynchronous operation", async () => {
  const scope = requestScope(undefined, 10);
  try {
    await assert.rejects(
      abortable(new Promise(() => {}), scope.signal),
      /取消|超时/,
    );
  } finally {
    scope.dispose();
  }
});
test("text content ignores reasoning and non-text blocks", () => {
  assert.equal(
    textContent([
      { type: "text", text: "answer" },
      { type: "thinking", thinking: "internal" },
      { type: "image", url: "x" },
    ]),
    "answer",
  );
});
