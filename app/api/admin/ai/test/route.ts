import { NextRequest, NextResponse } from "next/server";
import { requireRoles, isAuthError } from "@/lib/auth-middleware-app";
import { SettingsRepository } from "@/lib/repositories/SettingsRepository";
import { mcpRepository } from "@/lib/repositories/MCPRepository";
import { createChatModel } from "@/lib/ai/model";
import { Moderation } from "@/lib/ai/moderation";
import { createMCPClient } from "@/lib/ai/mcp";
import { generateQueryEmbedding } from "@/lib/embedding";
import { enforceRateLimit } from "@/lib/rate-limit-api";
import { abortable, requestScope, isReadOnlyTool } from "@/lib/ai/abort";

export async function POST(request: NextRequest) {
  const auth = requireRoles(request, ["admin"]);
  if (isAuthError(auth)) return auth;
  const limited = enforceRateLimit(request, "admin:ai:test", 6, 60000);
  if (limited) return limited;
  const input = await request.json().catch(() => null);
  if (
    !input ||
    !["model", "embedding", "mcp", "moderation"].includes(input.kind)
  )
    return NextResponse.json(
      { success: false, message: "测试类型无效" },
      { status: 400 },
    );
  const scope = requestScope(request.signal, 20000);
  const signal = scope.signal;
  try {
    if (input.kind === "model") {
      const settings = await SettingsRepository.getAISettings();
      const model = createChatModel({ ...settings, ai_max_tokens: 128 });
      await abortable(
        model.invoke([{ role: "user", content: "Reply OK." }], { signal }),
        signal,
      );
    } else if (input.kind === "moderation") {
      const settings = await SettingsRepository.getAISettings();
      await Moderation.check(
        settings,
        [{ role: "user", content: "你好，请介绍一下这篇博客文章。" }],
        signal,
      );
    } else if (input.kind === "embedding")
      await generateQueryEmbedding("连接测试", signal);
    else {
      const servers = await mcpRepository.getEnabledList();
      const server = servers.servers.find((s) => s.id === input.serverId);
      if (!server)
        return NextResponse.json(
          {
            success: false,
            message: "请选择已启用的服务器，并开启 MCP 总开关",
          },
          { status: 400 },
        );
      const client = createMCPClient(server);
      const stop = () => {
        void client.close().catch(() => {});
      };
      signal.addEventListener("abort", stop, { once: true });
      try {
        const pending = client.getTools();
        void pending.then(
          () => {
            if (signal.aborted) stop();
          },
          () => {},
        );
        const tools = await abortable(pending, signal);
        signal.throwIfAborted();
        return NextResponse.json({
          success: true,
          message: "连接成功（未执行工具）",
          data: tools.map((tool) => ({
            name: tool.name,
            readOnly: isReadOnlyTool(tool.metadata),
          })),
        });
      } finally {
        signal.removeEventListener("abort", stop);
        await client.close().catch(() => {});
      }
    }
    return NextResponse.json({ success: true, message: "连接测试成功" });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: signal.aborted
          ? "连接测试超时"
          : "连接测试失败，请核对已保存的地址、密钥、模型和服务端配置",
      },
      { status: 502 },
    );
  } finally {
    scope.dispose();
  }
}
