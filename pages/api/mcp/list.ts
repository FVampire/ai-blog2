import { NextApiRequest, NextApiResponse } from 'next';
import { mcpRepository } from '../../../lib/repositories/MCPRepository';

// 获取启用的 MCP 服务器列表（公开 API）
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  }

  try {
    const result = await mcpRepository.getEnabledList();

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get MCP servers error:', error);
    return res.status(500).json({
      success: false,
      message: '获取 MCP 服务器列表失败',
    });
  }
}
