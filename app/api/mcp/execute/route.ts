import { NextRequest, NextResponse } from 'next/server';

import { spawn } from 'child_process';

import { mcpRepository } from '@/lib/repositories/MCPRepository';

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

async function executeMCPTool(
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
        id: callId, name: toolName, arguments: args, startTime,
        endTime: new Date().toISOString(), status: 'error',
        error: 'MCP server not found or disabled',
      };
    }

    const commandArgs = [server.script_path, ...(server.args || []), toolName, JSON.stringify(args)];

    return new Promise<MCPToolCall>((resolve) => {
      const childProcess = spawn(server.command, commandArgs, {
        env: { ...process.env, ...server.env_vars },
        timeout: server.timeout_seconds * 1000,
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout.on('data', (data) => { output += data.toString(); });
      childProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

      childProcess.on('close', (code) => {
        const endTime = new Date().toISOString();
        if (code !== 0) {
          resolve({
            id: callId, name: toolName, arguments: args, startTime, endTime, status: 'error',
            error: errorOutput || `Process exited with code ${code}`,
          });
        } else {
          try {
            const parsed = JSON.parse(output);
            resolve({
              id: callId, name: toolName, arguments: args, startTime, endTime, status: 'success',
              result: typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : output,
            });
          } catch {
            resolve({
              id: callId, name: toolName, arguments: args, startTime, endTime, status: 'success',
              result: output,
            });
          }
        }
      });

      childProcess.on('error', (error) => {
        resolve({
          id: callId, name: toolName, arguments: args, startTime,
          endTime: new Date().toISOString(), status: 'error', error: error.message,
        });
      });
    });
  } catch (error: any) {
    return {
      id: callId, name: toolName, arguments: args, startTime,
      endTime: new Date().toISOString(), status: 'error', error: error.message,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { serverId, toolName, args } = await request.json();

    if (!serverId || !toolName) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数：serverId 和 toolName' },
        { status: 400 }
      );
    }

    const result = await executeMCPTool(serverId, toolName, args || {});

    return NextResponse.json({
      success: result.status === 'success',
      data: result,
    });
  } catch (error) {
    console.error('Execute MCP tool error:', error);
    return NextResponse.json(
      { success: false, message: '执行 MCP 工具失败' },
      { status: 500 }
    );
  }
}
