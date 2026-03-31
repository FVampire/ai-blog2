import { NextApiRequest, NextApiResponse } from 'next';
import { mcpRepository } from '../../../lib/repositories/MCPRepository';
import { spawn } from 'child_process';

// 获取 MCP 服务器的工具列表
async function getMCPTools(serverId: number) {
  try {
    const server = await mcpRepository.getById(serverId);
    if (!server || !server.is_enabled) {
      return { success: false, error: 'MCP server not found or disabled' };
    }

    // 使用 --list-tools 或 list 参数获取工具列表
    return new Promise<{ success: boolean; tools?: any[]; error?: string }>((resolve) => {
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

      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

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
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  }

  try {
    const { serverId } = req.query;

    if (!serverId) {
      return res.status(400).json({
        success: false,
        message: '缺少 serverId 参数',
      });
    }

    const result = await getMCPTools(Number(serverId));

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.tools,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }
  } catch (error) {
    console.error('Get MCP tools error:', error);
    return res.status(500).json({
      success: false,
      message: '获取 MCP 工具列表失败',
    });
  }
}
