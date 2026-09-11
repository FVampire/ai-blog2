import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { MCPRepository } from "../repositories/MCPRepository";
import { PostRepository } from "../repositories/PostRepository";
import { GET as getConfig } from "../../app/api/ai/config/route";
import { GET as getMCP } from "../../app/api/mcp/list/route";
import { POST as chat } from "../../app/api/ai/chat/route";
import { readChatEvents } from "./protocol";
import { createChatModel } from "./model";

test("public API and model round-trip use private configuration safely", async (t) => {
  let captured: Record<string, any> = {};
  let fail = false;
  let toolExecutions = 0;
  const server = createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end();
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    captured = JSON.parse(Buffer.concat(chunks).toString());
    if (req.url === "/mcp") {
      res.setHeader("Content-Type", "application/json");
      if (captured.id === undefined) {
        res.writeHead(202);
        res.end();
        return;
      }
      let result: Record<string, unknown> = {};
      if (captured.method === "initialize")
        result = {
          protocolVersion: captured.params.protocolVersion,
          capabilities: { tools: {} },
          serverInfo: { name: "fixture", version: "1" },
        };
      if (captured.method === "tools/list")
        result = {
          tools: [
            {
              name: "search",
              description: "Search fixture",
              inputSchema: {
                type: "object",
                properties: { query: { type: "string" } },
                required: ["query"],
              },
              annotations: { readOnlyHint: true },
            },
            {
              name: "write",
              description: "Forbidden write",
              inputSchema: { type: "object", properties: {} },
              annotations: { readOnlyHint: false },
            },
          ],
        };
      if (captured.method === "tools/call") {
        assert.equal(captured.params.name, "search");
        toolExecutions++;
        result = { content: [{ type: "text", text: "fixture search result" }] };
      }
      res.end(JSON.stringify({ jsonrpc: "2.0", id: captured.id, result }));
      return;
    }
    if (req.url === "/v1/messages") {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          id: "msg_fixture",
          type: "message",
          role: "assistant",
          model: "fixture-model",
          content: [{ type: "text", text: "OK" }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
      );
      return;
    }
    if (fail) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: {
            message: "private-upstream-error",
            type: "authentication_error",
          },
        }),
      );
      return;
    }
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    if (
      captured.tools?.length &&
      !captured.messages.some((m: { role: string }) => m.role === "tool")
    ) {
      assert.deepEqual(
        captured.tools.map(
          (tool: { function: { name: string } }) => tool.function.name,
        ),
        ["search"],
      );
      res.end(
        `data: ${JSON.stringify({ id: "chatcmpl-tool", object: "chat.completion.chunk", created: 1, model: "fixture-model", choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: "call_fixture", type: "function", function: { name: "search", arguments: '{"query":"fixture"}' } }] }, finish_reason: "tool_calls" }] })}\n\ndata: [DONE]\n\n`,
      );
      return;
    }
    for (const text of ["你好", "，文章摘要。"])
      res.write(
        `data: ${JSON.stringify({ id: "chatcmpl-test", object: "chat.completion.chunk", created: 1, model: "fixture-model", choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }] })}\n\n`,
      );
    res.end(
      `data: ${JSON.stringify({ id: "chatcmpl-test", object: "chat.completion.chunk", created: 1, model: "fixture-model", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`,
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const settings = {
    ai_enabled: true,
    ai_assistant_enabled: true,
    ai_provider: "other",
    ai_model: "fixture-model",
    ai_api_key: "fixture-private-key",
    ai_api_base_url: `http://127.0.0.1:${address.port}/v1`,
    ai_temperature: 0.3,
    ai_max_tokens: 512,
    ai_public_mcp_tools: { "7": ["search", "write"], "8": ["search"] },
  };
  const originalSettings = SettingsRepository.getAISettings;
  const originalPolicy = MCPRepository.prototype.getMCPSettings;
  const originalList = MCPRepository.prototype.getEnabledList;
  const originalPost = PostRepository.getPostById;
  SettingsRepository.getAISettings = async () => settings;
  MCPRepository.prototype.getMCPSettings = async () => ({
    enabled: true,
    allowUserSelect: false,
    defaultServerId: "",
  });
  MCPRepository.prototype.getEnabledList = async () => ({
    enabled: true,
    defaultServer: null,
    servers: [
      {
        id: 7,
        name: "approved",
        transport: "http",
        url: `http://127.0.0.1:${address.port}/mcp`,
        description: "public",
        scriptPath: "/private",
        headers: { Authorization: "fixture-private-header" },
        isDefault: true,
        timeoutSeconds: 30,
      },
      {
        id: 8,
        name: "hidden",
        description: "private",
        scriptPath: "",
        isDefault: false,
        timeoutSeconds: 30,
      },
    ],
  });
  PostRepository.getPostById = async () => ({
    id: 12,
    title: "测试文章",
    slug: "test-post",
    content: "只有当前文章才包含的正文证据",
    status: "published",
    excerpt: "",
    imageUrl: "",
    views: 0,
    authorId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
  });
  const makeRequest = (extra = {}) =>
    new NextRequest("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        requestId: randomUUID(),
        messageId: randomUUID(),
        messages: [{ role: "user", content: "总结这篇文章" }],
        mode: "article",
        articleId: 12,
        ...extra,
      }),
      headers: { "Content-Type": "application/json" },
    });
  try {
    await t.test(
      "configuration and server list exclude credentials and private servers",
      async () => {
        const config = await getConfig(
          new NextRequest("http://localhost/api/ai/config"),
        );
        const configText = await config.text();
        assert.doesNotMatch(configText, /fixture-private|api_key|base_url/);
        const list = await (await getMCP()).json();
        assert.equal(list.data.servers.length, 1);
        assert.deepEqual(Object.keys(list.data.servers[0]).sort(), [
          "description",
          "id",
          "name",
        ]);
        assert.doesNotMatch(
          JSON.stringify(list),
          /Authorization|fixture-private|\/private|hidden/,
        );
      },
    );
    await t.test(
      "article text, configured temperature and output budget reach the model",
      async () => {
        const response = await chat(makeRequest());
        assert.equal(response.status, 200);
        let content = "";
        let done = false;
        let sources = 0;
        await readChatEvents(response.body!, (event) => {
          if (event.type === "text-delta") content += event.text;
          if (event.type === "done") done = true;
          if (event.type === "sources") sources = event.sources.length;
          if (event.type === "error") assert.fail(event.text);
        });
        assert.equal(content, "你好，文章摘要。");
        assert.equal(done, true);
        assert.equal(sources, 1);
        assert.equal(captured.temperature, 0.3);
        assert.equal(
          captured.max_tokens ?? captured.max_completion_tokens,
          512,
        );
        assert.match(
          JSON.stringify(captured.messages),
          /只有当前文章才包含的正文证据/,
        );
      },
    );
    await t.test("assistant disabled is enforced by the server", async () => {
      settings.ai_assistant_enabled = false;
      assert.equal((await chat(makeRequest())).status, 403);
      settings.ai_assistant_enabled = true;
    });
    await t.test("draft articles never reach the provider", async () => {
      const publishedPost = PostRepository.getPostById;
      PostRepository.getPostById = async (id) => ({
        ...(await publishedPost(id))!,
        status: "draft",
      });
      const response = await chat(makeRequest());
      let failed = false;
      await readChatEvents(response.body!, (event) => {
        if (event.type === "error") failed = true;
      });
      assert.equal(failed, true);
      PostRepository.getPostById = publishedPost;
    });
    await t.test(
      "unapproved tool selection fails without connecting",
      async () => {
        const response = await chat(
          makeRequest({ mode: "none", mcpServerId: 8 }),
        );
        let failed = false;
        await readChatEvents(response.body!, (event) => {
          if (event.type === "error") failed = true;
        });
        assert.equal(failed, true);
      },
    );
    await t.test(
      "native Anthropic protocol uses the configured endpoint",
      async () => {
        const model = createChatModel({
          ...settings,
          ai_provider: "anthropic",
          ai_api_base_url: `http://127.0.0.1:${address.port}`,
        });
        const result = await model.invoke([{ role: "user", content: "test" }]);
        assert.deepEqual(result.content, "OK");
        assert.equal(captured.max_tokens, 512);
      },
    );
    await t.test(
      "MCP read-only allowlist executes and emits tool lifecycle events",
      async () => {
        const response = await chat(
          makeRequest({ mode: "none", mcpServerId: 7 }),
        );
        const events: string[] = [];
        await readChatEvents(response.body!, (event) => {
          events.push(event.type);
          if (event.type === "error") assert.fail(event.text);
        });
        assert.equal(toolExecutions, 1);
        assert.ok(events.includes("tool-start"));
        assert.ok(events.includes("tool-result"));
        assert.ok(events.includes("done"));
      },
    );
    await t.test("provider errors are sanitized", async () => {
      fail = true;
      const response = await chat(makeRequest({ mode: "none" }));
      const text = await response.text();
      assert.match(text, /"type":"error"/);
      assert.doesNotMatch(text, /private-upstream-error|fixture-private/);
    });
  } finally {
    SettingsRepository.getAISettings = originalSettings;
    MCPRepository.prototype.getMCPSettings = originalPolicy;
    MCPRepository.prototype.getEnabledList = originalList;
    PostRepository.getPostById = originalPost;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
