/**
 * 综合搜索API
 * 支持向量搜索和普通文本搜索，可根据配置自动选择
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  }

  try {
    const { type = 'auto' } = req.method === 'GET' ? req.query : req.body;

    // 根据类型选择搜索方式
    let targetUrl: string;

    if (type === 'vector') {
      // 强制使用向量搜索
      targetUrl = '/api/search/vector';
    } else if (type === 'text') {
      // 强制使用文本搜索
      targetUrl = '/api/posts';
    } else {
      // auto模式：默认使用向量搜索，API内部会处理回退逻辑
      targetUrl = '/api/search/vector';
    }

    // 获取原始请求的查询参数
    const queryParams = req.method === 'GET' ? req.query : req.body;

    // 转发到对应的API
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.host || 'localhost:3000';

    const url = new URL(targetUrl, `${protocol}://${host}`);

    // 添加查询参数
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    // 转发请求
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
      ...(req.method === 'POST' && req.body ? { body: JSON.stringify(req.body) } : {}),
    });

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Search API error:', error);
    return res.status(500).json({
      success: false,
      message: '搜索失败',
      error: error.message,
    });
  }
}
