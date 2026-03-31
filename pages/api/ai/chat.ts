import { NextApiRequest, NextApiResponse } from 'next';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { generateText, tool, LanguageModel, ToolSet } from 'ai';
import { z } from 'zod';
import { mcpRepository } from '../../../lib/repositories/MCPRepository';
import { spawn } from 'child_process';

// MCP 工具定义接口
interface MCPTool {
  id: string;
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// MCP 服务器信息接口
interface MCPServerInfo {
  id: number;
  name: string;
  description: string;
  tools: MCPTool[];
}

// 执行 MCP 工具调用
async function executeMCPTool(
  serverId: number,
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  const server = await mcpRepository.getById(serverId);
  if (!server || !server.is_enabled) {
    throw new Error('MCP server not found or disabled');
  }

  const commandArgs = [
    server.script_path,
    ...(server.args || []),
    toolName,
    JSON.stringify(args)
  ];

  return new Promise<any>((resolve, reject) => {
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
      if (code !== 0) {
        reject(new Error(errorOutput || `Process exited with code ${code}`));
      } else {
        try {
          const parsed = JSON.parse(output);
          resolve(parsed);
        } catch {
          resolve(output);
        }
      }
    });

    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// 获取 MCP 服务器的工具列表
async function getMCPServerTools(serverId: number): Promise<MCPTool[]> {
  try {
    const result = await executeMCPTool(serverId, 'list_tools', {});
    return result.tools || [];
  } catch (error) {
    console.error(`Failed to get tools for MCP server ${serverId}:`, error);
    return [];
  }
}

// ========== Step 1: 获取 MCP 列表和用户传入的 MCP，返回工具 ==========

// 获取可用的 MCP 服务器列表及其工具
async function getAvailableMCPServers(): Promise<MCPServerInfo[]> {
  try {
    // 检查 MCP 是否启用
    const mcpEnabledResult = await mcpRepository.isMCPEnabled();
    if (!mcpEnabledResult) {
      return [];
    }

    // 获取启用的 MCP 服务器列表
    const enabledServers = await mcpRepository.getEnabledList();
    if (!enabledServers.enabled || enabledServers.servers.length === 0) {
      return [];
    }

    // 获取每个服务器的工具
    const serversWithTools: MCPServerInfo[] = [];
    for (const server of enabledServers.servers) {
      const tools = await getMCPServerTools(server.id);
      serversWithTools.push({
        id: server.id,
        name: server.name,
        description: server.description,
        tools,
      });
    }

    return serversWithTools;
  } catch (error) {
    console.error('Failed to get available MCP servers:', error);
    return [];
  }
}

// 根据用户传入的 MCP 名称筛选可用的 MCP 服务器
async function filterMCPServers(
  availableServers: MCPServerInfo[],
  userSelectedMCPs?: string[]
): Promise<MCPServerInfo[]> {
  if (!userSelectedMCPs || userSelectedMCPs.length === 0) {
    // 如果用户没有指定，返回全部可用 MCP
    return availableServers;
  }

  // 筛选用户选择的 MCP（必须在可用列表中）
  const filtered = availableServers.filter(server =>
    userSelectedMCPs.includes(server.name)
  );

  return filtered;
}

// ========== Step 2: 获取 Model ==========

// 获取 Model
function getModel(provider: string, model: string): LanguageModel {
  const lowerProvider = provider.toLowerCase();

  switch (lowerProvider) {
    case 'anthropic':
    case 'claude':
      return anthropic(model);
    case 'openai':
    case 'gpt':
      return openai(model);
    case 'google':
    case 'gemini':
      return google(model);
    default:
      // 默认使用 anthropic
      return anthropic(model);
  }
}

// ========== Step 3: 生成 Agent，将 model 和 tools 作为参数传入 ==========

// 生成 Agent 工具（将 MCP 工具转换为 AI SDK 工具格式）
function generateAgentTools(mcpServers: MCPServerInfo[]): ToolSet {
  const tools: ToolSet = {};

  for (const server of mcpServers) {
    for (const mcpTool of server.tools) {
      // 工具名称前缀加上服务器名称，避免冲突
      const toolName = `${server.name}_${mcpTool.name}`.replace(/[^a-zA-Z0-9_]/g, '_');

      // 构建 Zod schema
      const schemaShape: Record<string, z.ZodType<any>> = {};
      const properties = mcpTool.inputSchema?.properties || {};
      const required = mcpTool.inputSchema?.required || [];

      for (const [key, prop] of Object.entries(properties)) {
        const propType = (prop as any).type;
        let zodType: z.ZodType<any>;

        switch (propType) {
          case 'string':
            zodType = z.string();
            break;
          case 'number':
          case 'integer':
            zodType = z.number();
            break;
          case 'boolean':
            zodType = z.boolean();
            break;
          case 'array':
            zodType = z.array(z.any());
            break;
          case 'object':
            zodType = z.record(z.any());
            break;
          default:
            zodType = z.any();
        }

        // 如果不是必需的，设为可选
        if (!required.includes(key)) {
          zodType = zodType.optional();
        }

        schemaShape[key] = zodType;
      }

      tools[toolName] = tool({
        description: `[${server.name}] ${mcpTool.description || mcpTool.name}`,
        parameters: z.object(schemaShape),
        execute: async (args) => {
          return await executeMCPTool(server.id, mcpTool.name, args);
        },
      });
    }
  }

  return tools;
}

// 验证请求体
function validateRequest(body: any): {
  valid: boolean;
  error?: string;
  data?: {
    messages: Array<{ role: string; content: string }>;
    provider: string;
    model: string;
    systemPrompt?: string;
    mcpServers?: string[];
    stream?: boolean;
  };
} {
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return { valid: false, error: '缺少 messages 参数或格式不正确' };
  }

  if (!body.provider || typeof body.provider !== 'string') {
    return { valid: false, error: '缺少 provider 参数' };
  }

  if (!body.model || typeof body.model !== 'string') {
    return { valid: false, error: '缺少 model 参数' };
  }

  // 过滤有效消息
  const messages = body.messages.filter((m: any) =>
    m && typeof m === 'object' && m.role && m.content
  );

  if (messages.length === 0) {
    return { valid: false, error: 'messages 中没有有效的消息' };
  }

  return {
    valid: true,
    data: {
      messages,
      provider: body.provider,
      model: body.model,
      systemPrompt: body.systemPrompt,
      mcpServers: body.mcpServers,
      stream: body.stream,
    }
  };
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
    // 验证请求
    const validation = validateRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const { messages, provider, model, systemPrompt, mcpServers: userMCPs, stream } = validation.data!;

    // Step 1: 获取可用的 MCP 服务器列表
    const availableMCPServers = await getAvailableMCPServers();
    console.log(`[AI Chat] 可用 MCP 服务器: ${availableMCPServers.map(s => s.name).join(', ') || '无'}`);

    // 筛选用户选择的 MCP 服务器（如果在可用列表中）
    const selectedMCPServers = await filterMCPServers(availableMCPServers, userMCPs);
    console.log(`[AI Chat] 用户选择的 MCP: ${userMCPs?.join(', ') || '全部'}`);
    console.log(`[AI Chat] 最终使用的 MCP: ${selectedMCPServers.map(s => s.name).join(', ') || '无'}`);

    // Step 2: 获取 Model
    const languageModel = getModel(provider, model);
    console.log(`[AI Chat] 使用模型: ${provider} / ${model}`);

    // Step 3: 生成 Agent 工具
    const tools = generateAgentTools(selectedMCPServers);
    console.log(`[AI Chat] 可用工具数量: ${Object.keys(tools).length}`);

    // 调用 AI 生成回复
    const result = await generateText({
      model: languageModel,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      system: systemPrompt,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      maxSteps: 10,
    });

    // 返回结果
    return res.status(200).json({
      success: true,
      data: {
        content: result.text,
        toolCalls: result.toolCalls || [],
        toolResults: result.toolResults || [],
        finishReason: result.finishReason,
        usage: result.usage,
      },
      meta: {
        model: `${provider}/${model}`,
        mcpServers: selectedMCPServers.map(s => ({
          id: s.id,
          name: s.name,
          toolCount: s.tools.length,
        })),
      },
    });

  } catch (error: any) {
    console.error('AI Chat error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'AI 对话失败',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
