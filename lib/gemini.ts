export interface GeminiInput {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiResult {
  text: string;
  model: string;
  durationMs: number;
  finishReason: string;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 60_000;
const MODEL_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/;

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') return 'Gemini 请求超时';
  if (error instanceof Error && error.message) return error.message;
  return 'Gemini 请求失败';
}

export function getGeminiConfiguration() {
  return {
    configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
  };
}

export function validateGeminiInput(input: GeminiInput): string | null {
  if (!input.prompt.trim()) return '请输入提示词';
  if (input.prompt.length > 20_000) return '提示词最多 20000 个字符';
  if ((input.systemInstruction?.length || 0) > 10_000) return '系统提示词最多 10000 个字符';
  if (input.model && !MODEL_PATTERN.test(input.model)) return '模型名称格式无效';
  if (input.temperature !== undefined && (input.temperature < 0 || input.temperature > 2)) {
    return '温度必须在 0 到 2 之间';
  }
  if (input.maxOutputTokens !== undefined && (
    !Number.isInteger(input.maxOutputTokens) || input.maxOutputTokens < 1 || input.maxOutputTokens > 8192
  )) {
    return '最大输出 Token 必须是 1 到 8192 之间的整数';
  }
  return null;
}

export async function generateGeminiContent(input: GeminiInput): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
  if (!apiKey) throw new Error('未配置 GEMINI_API_KEY');

  const validationError = validateGeminiInput(input);
  if (validationError) throw new Error(validationError);

  const model = input.model?.trim() || getGeminiConfiguration().model;
  if (!MODEL_PATTERN.test(model)) throw new Error('GEMINI_MODEL 格式无效');

  const payload: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: input.prompt.trim() }] }],
    generationConfig: {
      temperature: input.temperature ?? 0.7,
      maxOutputTokens: input.maxOutputTokens ?? 2048,
    },
  };
  if (input.systemInstruction?.trim()) {
    payload.systemInstruction = { parts: [{ text: input.systemInstruction.trim() }] };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    });
    const raw = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!raw) throw new Error(`Gemini 返回了无效 JSON（HTTP ${response.status}）`);

    if (!response.ok) {
      const apiError = raw.error && typeof raw.error === 'object'
        ? raw.error as Record<string, unknown>
        : {};
      throw new Error(stringValue(apiError.message) || `Gemini 响应异常（HTTP ${response.status}）`);
    }

    const candidates = Array.isArray(raw.candidates) ? raw.candidates : [];
    const candidate = candidates[0] && typeof candidates[0] === 'object'
      ? candidates[0] as Record<string, unknown>
      : {};
    const content = candidate.content && typeof candidate.content === 'object'
      ? candidate.content as Record<string, unknown>
      : {};
    const parts = Array.isArray(content.parts) ? content.parts : [];
    const text = parts.map((part) => {
      const item = part && typeof part === 'object' ? part as Record<string, unknown> : {};
      return stringValue(item.text);
    }).filter(Boolean).join('\n');
    if (!text) {
      const blockReason = raw.promptFeedback && typeof raw.promptFeedback === 'object'
        ? stringValue((raw.promptFeedback as Record<string, unknown>).blockReason)
        : '';
      throw new Error(blockReason ? `Gemini 拒绝了该请求：${blockReason}` : 'Gemini 未返回文本内容');
    }

    const usage = raw.usageMetadata && typeof raw.usageMetadata === 'object'
      ? raw.usageMetadata as Record<string, unknown>
      : {};
    return {
      text,
      model,
      durationMs: Date.now() - startedAt,
      finishReason: stringValue(candidate.finishReason),
      usage: {
        promptTokens: numberValue(usage.promptTokenCount),
        completionTokens: numberValue(usage.candidatesTokenCount),
        totalTokens: numberValue(usage.totalTokenCount),
      },
    };
  } catch (error) {
    throw new Error(errorMessage(error));
  } finally {
    clearTimeout(timer);
  }
}
