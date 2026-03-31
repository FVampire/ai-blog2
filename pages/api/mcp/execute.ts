import { NextApiRequest, NextApiResponse } from 'next';
import { mcpRepository } from '../../../lib/repositories/MCPRepository';
import { spawn } from 'child_process';

// MCP 工具执行结果接口
export interface MCPToolCall {
  id: string;
  name: string;
  description?: string;
  arguments: Record<string, any>;
  result?: string;
  error?: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'error';
}

// 执行 MCP 工具
export async function executeMCPTool(
  serverId: number,
  toolName: string,
  args: Record<string, any>
): Promise<MCPToolCall> {
  const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date().toISOString();

  try {
    const server = await mcpRepository.getById(serverId);
    if (!server || !server.is_enabled) {
      return {
        id: callId,
        name: toolName,
        arguments: args,
        startTime,
        endTime: new Date().toISOString(),
        status: 'error',
        error: 'MCP server not found or disabled',
      };
    }

    // 执行工具调用
    const commandArgs = [
      server.script_path,
      ...(server.args || []),
      toolName,
      JSON.stringify(args)
    ];

    return new Promise<MCPToolCall>((resolve) => {
      const childProcess = spawn(server.command, commandArgs, {
        env: { ...process.env, ...server.env_vars },
        timeout: server.timeout_seconds * 1000,
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
        const endTime = new Date().toISOString();

        if (code !== 0) {
          resolve({
            id: callId,
            name: toolName,
            arguments: args,
            startTime,
            endTime,
            status: 'error',
            error: errorOutput || `Process exited with code ${code}`,
          });
        } else {
          try {
            // 尝试解析 JSON 结果
            const parsed = JSON.parse(output);
            resolve({
              id: callId,
              name: toolName,
              arguments: args,
              result: typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : output,
              startTime,
              endTime,
              status: 'success',
            });
          } catch {
            // 如果不是 JSON，直接返回原始输出
            resolve({
              id: callId,
              name: toolName,
              arguments: args,
              result: output,
              startTime,
              endTime,
              status: 'success',
            });
          }
        }
      });

      childProcess.on('error', (error) => {
        resolve({
          id: callId,
          name: toolName,
          arguments: args,
          startTime,
          endTime: new Date().toISOString(),
          status: 'error',
          error: error.message,
        });
      });
    });
  } catch (error: any) {
    return {
      id: callId,
      name: toolName,
      arguments: args,
      startTime,
      endTime: new Date().toISOString(),
      status: 'error',
      error: error.message,
    };
  }
}

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  }

  try {
    const { serverId, toolName, args } = req.body;

    if (!serverId || !toolName) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：serverId 和 toolName',
      });
    }

    const result = await executeMCPTool(serverId, toolName, args || {});

    return res.status(200).json({
      success: result.status === 'success',
      data: result,
    });
  } catch (error) {
    console.error('Execute MCP tool error:', error);
    return res.status(500).json({
      success: false,
      message: '执行 MCP 工具失败',
    });
  }
}
