import { SettingsRepository } from '../repositories/SettingsRepository';
import { stripMarkdown, truncateText } from '../text-plain';

export async function completeChat(system: string, user: string): Promise<string | null> {
  try {
    const settings = await SettingsRepository.getAISettings();
    const enabled = String(settings.ai_enabled).toLowerCase() === 'true';
    const apiKey = String(settings.ai_api_key || '').trim();
    if (!enabled || !apiKey) return null;

    const model = String(settings.ai_model_light || settings.ai_model || 'gpt-4o-mini');
    const baseUrl = String(settings.ai_api_base_url || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 400,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI complete failed:', response.status, await response.text().catch(() => ''));
      return null;
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (error) {
    console.error('AI complete error:', error);
    return null;
  }
}

export async function generateExcerpt(title: string, content: string): Promise<string> {
  const fallback = truncateText(stripMarkdown(content || title), 160);
  const text = await completeChat(
    '你是博客编辑。根据标题和正文写一句中文摘要，不超过 80 字，不要引号、不要“本文介绍”。',
    `标题：${title}\n\n正文：\n${truncateText(stripMarkdown(content), 1800)}`,
  );
  return truncateText(text || fallback, 200);
}

export async function suggestTags(title: string, content: string, existing: string[]): Promise<string[]> {
  const known = existing.filter(Boolean).slice(0, 40);
  const text = await completeChat(
    '你是博客编辑。只返回 2 到 4 个短标签，用英文逗号分隔，不要编号和其他文字。优先从候选里选。',
    `标题：${title}\n候选标签：${known.join('、') || '无'}\n正文：${truncateText(stripMarkdown(content), 1200)}`,
  );
  if (!text) return [];

  const parsed = text
    .split(/[,，、\n]/)
    .map((item) => item.replace(/^[\s#*-]+/, '').trim())
    .filter((item) => item.length > 0 && item.length <= 20)
    .slice(0, 4);

  if (known.length === 0) return parsed;
  const lower = new Map(known.map((name) => [name.toLowerCase(), name]));
  return parsed.map((name) => lower.get(name.toLowerCase()) || name);
}
