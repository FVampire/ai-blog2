import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export function createChatModel(
  settings: Record<string, any>,
  options: { disableThinking?: boolean } = {},
) {
  const provider = settings.ai_provider || "openai";
  const key = String(settings.ai_api_key || "").trim();
  const model = String(settings.ai_model || "").trim();
  if (!key || !model) throw new Error("请配置模型和 API 密钥");
  const maxTokens = Number(settings.ai_max_tokens ?? 2048);
  const temperature =
    settings.ai_temperature_enabled === false
      ? undefined
      : Number(settings.ai_temperature ?? 0.7);
  if (
    !Number.isInteger(maxTokens) ||
    maxTokens < 128 ||
    maxTokens > 16384 ||
    (temperature !== undefined &&
      (!Number.isFinite(temperature) ||
        temperature < 0 ||
        temperature > (provider === "anthropic" ? 1 : 2)))
  )
    throw new Error("模型参数配置无效");
  const baseURL = String(settings.ai_api_base_url || "").trim();
  if (baseURL && !/^https?:\/\//.test(baseURL))
    throw new Error("模型地址配置无效");
  if (provider === "anthropic")
    return new ChatAnthropic({
      apiKey: key,
      model,
      maxTokens,
      temperature,
      anthropicApiUrl: baseURL || undefined,
      maxRetries: 0,
    });
  const defaults: Record<string, string> = {
    deepseek: "https://api.deepseek.com",
    moonshot: "https://api.moonshot.cn/v1",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  };
  if (
    !["openai", "deepseek", "moonshot", "qwen", "other"].includes(provider) ||
    (provider === "other" && !baseURL)
  )
    throw new Error("服务商或兼容接口地址配置无效");
  return new ChatOpenAI({
    ...(options.disableThinking && /^qwen3[.-]/i.test(model)
      ? { modelKwargs: { enable_thinking: false } }
      : {}),
    apiKey: key,
    model,
    maxTokens,
    temperature,
    configuration: { baseURL: baseURL || defaults[provider] },
    maxRetries: 0,
  });
}
