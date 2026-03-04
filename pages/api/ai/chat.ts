import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

// 获取 AI 设置
async function getAISettings() {
  const result = await query(
    "SELECT key, value, type FROM settings WHERE key LIKE 'ai_%'"
  );

  const settings: Record<string, any> = {};
  result.rows.forEach(row => {
    let value = row.value;
    if (row.type === 'boolean') {
      value = row.value === 'true';
    }
    settings[row.key] = value;
  });

  return settings;
}

// 获取最近的文章作为上下文
async function getBlogContext() {
  const result = await query(`
    SELECT title, excerpt, content
    FROM posts
    WHERE status = 'published'
    ORDER BY created_at DESC
    LIMIT 5
  `);

  return result.rows.map(post => ({
    title: post.title,
    excerpt: post.excerpt || post.content?.substring(0, 200),
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const settings = await getAISettings();

    // 检查 AI 是否启用
    if (!settings.ai_enabled) {
      return res.status(400).json({
        success: false,
        message: 'AI 功能未启用',
      });
    }

    // 检查 API Key
    if (!settings.ai_api_key) {
      return res.status(400).json({
        success: false,
        message: 'AI API 密钥未配置',
      });
    }

    const { message, history = [], articleContext = null } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: '消息不能为空',
      });
    }

    // Build context based on whether we have article context or general blog context
    let contextText = '';

    if (articleContext) {
      // Article-specific context - user is viewing an article
      contextText = `

当前用户正在阅读的文章：
标题：${articleContext.title}
作者：${articleContext.author}
标签：${articleContext.tags?.join(', ') || '无'}
摘要：${articleContext.excerpt || '无摘要'}

文章内容：
${articleContext.content}

请根据上述文章内容来回答用户的问题。如果用户的问题与文章无关，也可以友好地回答，但优先关注文章相关的问题。`;
    } else {
      // General context - fetch recent blog posts
      const blogContext = await getBlogContext();
      if (blogContext.length > 0) {
        contextText = `\n\n博客最近文章:\n${blogContext.map(p => `- ${p.title}: ${p.excerpt}`).join('\n')}`;
      }
    }

    // 构建消息
    const systemPrompt = (settings.ai_assistant_system_prompt || '你是一个友好的博客AI助手。') + contextText;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // 只保留最近10条历史
      { role: 'user', content: message },
    ];

    // 根据 provider 调用不同的 AI 服务
    const provider = settings.ai_provider || 'openai';
    const model = settings.ai_model || 'gpt-3.5-turbo';
    const apiKey = settings.ai_api_key;
    const baseUrl = settings.ai_api_base_url;

    let apiUrl: string;
    let headers: Record<string, string>;
    let body: any;

    if (provider === 'anthropic') {
      // Anthropic Claude API
      apiUrl = baseUrl || 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      body = {
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content,
        })),
      };
    } else {
      // OpenAI 兼容 API (OpenAI, DeepSeek 等)
      apiUrl = baseUrl
        ? `${baseUrl}/chat/completions`
        : 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      body = {
        model: model,
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7,
      };
    }

    // 调用 AI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI API error:', errorData);
      return res.status(500).json({
        success: false,
        message: 'AI 服务调用失败',
      });
    }

    const data = await response.json();

    // 解析响应
    let reply: string;
    if (provider === 'anthropic') {
      reply = data.content?.[0]?.text || '';
    } else {
      reply = data.choices?.[0]?.message?.content || '';
    }

    return res.status(200).json({
      success: true,
      data: {
        reply,
        model: model,
        provider: provider,
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}
