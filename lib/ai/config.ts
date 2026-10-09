import { z } from "zod";

export const aiSettingSchemas = {
  ai_enabled: z.boolean(),
  ai_assistant_enabled: z.boolean(),
  ai_provider: z.enum([
    "openai",
    "anthropic",
    "deepseek",
    "moonshot",
    "qwen",
    "other",
  ]),
  ai_api_key: z.string().max(4096),
  ai_api_base_url: z.union([
    z.literal(""),
    z.url().refine((v) => /^https?:\/\//.test(v)),
  ]),
  ai_model: z.string().max(200),
  ai_model_light: z.string().max(200),
  ai_temperature: z.number().min(0).max(2),
  ai_temperature_enabled: z.boolean(),
  ai_max_tokens: z.number().int().min(128).max(16384),
  ai_global_requests_per_minute: z.number().int().min(1).max(10000),
  ai_anonymous_requests_per_day: z.number().int().min(1).max(100000),
  ai_daily_request_budget: z.number().int().min(0).max(10000000),
  ai_moderation_enabled: z.boolean(),
  ai_moderation_model: z.string().trim().min(1).max(200),
  ai_moderation_timeout_seconds: z.number().int().min(3).max(60),
  ai_assistant_name: z.string().max(100),
  ai_assistant_avatar: z
    .string()
    .max(2048)
    .refine((v) => !v || /^\/(?!\/)/.test(v) || /^https?:\/\//.test(v)),
  ai_assistant_welcome: z.string().max(2000),
  ai_assistant_system_prompt: z.string().max(12000),
  ai_embedding_model: z.string().max(200),
  ai_embedding_api_key: z.string().max(4096),
  ai_embedding_api_base_url: z.union([
    z.literal(""),
    z.url().refine((v) => /^https?:\/\//.test(v)),
  ]),
  ai_embedding_dimensions: z.literal(1024),
  ai_vector_search_enabled: z.boolean(),
  ai_vector_search_threshold: z.number().min(0).max(1),
  ai_vector_search_weight_title: z.number().min(0).max(1),
  ai_vector_search_weight_content: z.number().min(0).max(1),
  ai_vector_search_weight_excerpt: z.number().min(0).max(1),
  mcp_enabled: z.boolean(),
  mcp_allow_user_select: z.boolean(),
  ai_public_mcp_tools: z.record(
    z.string().regex(/^\d+$/),
    z.array(z.string().min(1).max(200)).max(30),
  ),
};

export const aiDefaults: Record<string, unknown> = {
  ai_enabled: false,
  ai_assistant_enabled: false,
  ai_provider: "openai",
  ai_model: "",
  ai_temperature: 0.7,
  ai_temperature_enabled: true,
  ai_max_tokens: 2048,
  ai_global_requests_per_minute: 4,
  ai_anonymous_requests_per_day: 5,
  ai_daily_request_budget: 0,
  ai_moderation_enabled: true,
  ai_moderation_model: "qwen3.5-flash",
  ai_moderation_timeout_seconds: 15,
  ai_assistant_name: "AI 助手",
  ai_assistant_welcome: "你好，可以向我提问，也可以选择文章知识来源。",
  ai_embedding_dimensions: 1024,
  ai_vector_search_enabled: false,
  ai_public_mcp_tools: {},
  mcp_enabled: false,
  mcp_allow_user_select: true,
};

export function publicTools(
  settings: Record<string, unknown>,
): Record<string, string[]> {
  let value = settings.ai_public_mcp_tools;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  const parsed = aiSettingSchemas.ai_public_mcp_tools.safeParse(value);
  return parsed.success ? parsed.data : {};
}

export function publicAIConfig(settings: Record<string, unknown>) {
  return {
    ai_available:
      settings.ai_enabled === true &&
      !!settings.ai_api_key &&
      !!settings.ai_model,
    ai_assistant_enabled: settings.ai_assistant_enabled === true,
    ai_assistant_name: String(settings.ai_assistant_name || "AI 助手"),
    ai_assistant_welcome: String(settings.ai_assistant_welcome || ""),
    ai_assistant_avatar: aiSettingSchemas.ai_assistant_avatar.safeParse(
      settings.ai_assistant_avatar,
    ).success
      ? String(settings.ai_assistant_avatar)
      : "",
    knowledge_available:
      settings.ai_vector_search_enabled === true &&
      !!settings.ai_embedding_api_key &&
      !!settings.ai_embedding_model,
  };
}
