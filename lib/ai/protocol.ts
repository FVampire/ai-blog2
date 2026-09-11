import { z } from "zod";

export const chatRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    messageId: z.string().uuid(),
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(12000),
          })
          .strict(),
      )
      .min(1)
      .max(40),
    mode: z.enum(["article", "site", "none"]).default("none"),
    articleId: z.number().int().positive().optional(),
    mcpServerId: z.number().int().positive().nullable().default(null),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.messages[value.messages.length - 1]?.role !== "user")
      ctx.addIssue({ code: "custom", message: "最后一条消息必须是用户消息" });
    if (value.messages.reduce((n, m) => n + m.content.length, 0) > 48000)
      ctx.addIssue({ code: "custom", message: "对话过长，请新建对话" });
    if (value.mode === "article" && !value.articleId)
      ctx.addIssue({ code: "custom", message: "请选择当前文章" });
  });

export interface Source {
  id: number;
  title: string;
  url: string;
}
export type ChatEvent = { requestId: string; messageId: string } & (
  | { type: "start" }
  | { type: "status"; text: string }
  | { type: "text-delta"; text: string }
  | { type: "sources"; sources: Source[] }
  | { type: "warning"; text: string }
  | { type: "tool-start"; id: string; name: string }
  | { type: "tool-result"; id: string; ok: boolean }
  | { type: "done" }
  | { type: "error"; text: string }
);

/** Network chunks are not SSE frames. Keep incomplete frames until the next read. */
export async function readChatEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let ended = false;
  const consume = () => {
    let match: RegExpExecArray | null;
    while ((match = /\r?\n\r?\n/.exec(buffer))) {
      const frame = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      const data = frame
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) continue;
      const event = JSON.parse(data) as ChatEvent;
      if (event.type === "done" || event.type === "error") ended = true;
      onEvent(event);
    }
  };
  try {
    while (!ended) {
      const { done, value } = await reader.read();
      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });
      if (buffer.length > 1_000_000) throw new Error("响应内容过大");
      consume();
      if (done) break;
    }
    if (!ended) throw new Error("连接中断，回答尚未完成，请重试");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function textContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("");
}

export function modelHistory(
  messages: {
    role: "user" | "assistant";
    content: string;
    local?: boolean;
    status?: string;
  }[],
) {
  const candidates = messages
    .filter(
      (m) =>
        !m.local &&
        (m.role === "user" || m.status === "complete") &&
        m.content.trim(),
    )
    .slice(-39);
  const result: { role: "user" | "assistant"; content: string }[] = [];
  let remaining = 48000;
  for (let index = candidates.length - 1; index >= 0; index--) {
    const item = candidates[index];
    const content = item.content.slice(0, 12000);
    if (content.length > remaining) break;
    result.unshift({ role: item.role, content });
    remaining -= content.length;
  }
  // Some native providers require the first turn to come from the user.
  while (result[0]?.role === "assistant") result.shift();
  return result;
}
