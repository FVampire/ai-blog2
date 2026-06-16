import { NextRequest, NextResponse } from 'next/server';

import { spawn } from 'child_process';

import { mcpRepository } from '@/lib/repositories/MCPRepository';

function getMCPTools(serverId: number): Promise<{ success: boolean; tools?: any[]; error?: string }> {
  return new Promise(async (resolve) => {
    try {
      const server = await mcpRepository.getById(serverId);
      if (!server || !server.is_enabled) {
        resolve({ success: false, error: 'MCP server not found or disabled' });
        return;
      }

      const childProcess = spawn(server.command, [
        server.script_path,
        ...(server.args || []),
        '--list-tools'
      ], {
        env: { ...process.env, ...server.env_vars },
        timeout: (server.timeout_seconds || 30) * 1000,
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout.on('data', (data) => { output += data.toString(); });
      childProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

      childProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({ success: false, error: errorOutput || `Process exited with code ${code}` });
        } else {
          try {
            const tools = JSON.parse(output);
            resolve({ success: true, tools });
          } catch {
            resolve({ success: false, error: 'Failed to parse tools output' });
          }
        }
      });

      childProcess.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
    } catch (error: any) {
      resolve({ success: false, error: error.message });
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const serverId = request.nextUrl.searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { success: false, message: '缺少 serverId 参数' },
        { status: 400 }
      );
    }

    const result = await getMCPTools(Number(serverId));

    if (result.success) {
      return NextResponse.json({ success: true, data: result.tools });
    } else {
      return NextResponse.json({ success: false, message: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Get MCP tools error:', error);
    return NextResponse.json(
      { success: false, message: '获取 MCP 工具列表失败' },
      { status: 500 }
    );
  }
}
