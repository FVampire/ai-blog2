import { NextResponse } from "next/server";

import { mcpRepository } from "@/lib/repositories/MCPRepository";
import { SettingsRepository } from "@/lib/repositories/SettingsRepository";
import { publicTools } from "@/lib/ai/config";

export async function GET() {
  try {
    const result = await mcpRepository.getEnabledList();
    const allowed = publicTools(await SettingsRepository.getAISettings());
    const policy = await mcpRepository.getMCPSettings();
    const visible = result.servers.filter((s) => allowed[s.id]?.length);
    const defaultServer =
      visible.find((s) => s.isDefault) || visible[0] || null;
    const toPublic = (s: (typeof visible)[number]) => ({
      id: s.id,
      name: s.name,
      description: s.description,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          enabled: result.enabled && visible.length > 0,
          servers: (policy.allowUserSelect
            ? visible
            : defaultServer
              ? [defaultServer]
              : []
          ).map(toPublic),
          defaultServer: defaultServer ? toPublic(defaultServer) : null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get MCP servers error:", error);
    return NextResponse.json(
      { success: false, message: "获取 MCP 服务器列表失败" },
      { status: 500 },
    );
  }
}
