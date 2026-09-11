import { NextRequest, NextResponse } from "next/server";

import { SettingsRepository } from "@/lib/repositories/SettingsRepository";
import { MCPRepository } from "@/lib/repositories/MCPRepository";
import { publicAIConfig, publicTools } from "@/lib/ai/config";

export async function GET(request: NextRequest) {
  try {
    const defaultConfig = {
      ai_enabled: false,
      ai_provider: "openai",
      ai_model: "gpt-3.5-turbo",
      ai_model_light: "",
      ai_embedding_model: "",
      ai_assistant_enabled: false,
      ai_summary_enabled: false,
      ai_search_enabled: false,
      ai_available: false,
      mcp_enabled: false,
      mcp_allow_user_select: true,
    };

    try {
      const settings = await SettingsRepository.getAISettings();
      const mcpRepo = new MCPRepository();
      const mcpSettings = await mcpRepo.getMCPSettings();

      return NextResponse.json(
        {
          success: true,
          data: {
            ...publicAIConfig(settings),
            mcp_enabled:
              mcpSettings.enabled &&
              Object.values(publicTools(settings)).some(
                (names) => names.length > 0,
              ),
            mcp_allow_user_select: mcpSettings.allowUserSelect,
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error: any) {
      if (
        error.message?.includes("does not exist") ||
        error.message?.includes("doesn't exist")
      ) {
        return NextResponse.json({ success: true, data: defaultConfig });
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Get AI config error:", error);
    return NextResponse.json(
      { success: false, message: "获取配置失败" },
      { status: 500 },
    );
  }
}
