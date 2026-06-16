import { NextResponse } from 'next/server';

import { mcpRepository } from '@/lib/repositories/MCPRepository';

export async function GET() {
  try {
    const result = await mcpRepository.getEnabledList();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get MCP servers error:', error);
    return NextResponse.json(
      { success: false, message: '获取 MCP 服务器列表失败' },
      { status: 500 }
    );
  }
}
