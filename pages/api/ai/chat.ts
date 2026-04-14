import { NextApiRequest, NextApiResponse } from "next";
// import { anthropic } from '@ai-sdk/anthropic';
// import { openai } from '@ai-sdk/openai';
// import { google } from '@ai-sdk/google';
// import { generateText, tool, LanguageModel, ToolSet } from 'ai';
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI, type ClientOptions } from "@langchain/openai";
import { createAgent, HumanMessage } from "langchain";
import { z } from "zod";
import { mcpRepository, MCPServerListItem } from "../../../lib/repositories/MCPRepository";
import { SettingsRepository } from "../../../lib/repositories/SettingsRepository";
import { NextResponse } from "next/server";
import { Readable } from "stream";

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
async function executeMCPTool(serverId: number, toolName: string, args: Record<string, any>): Promise<any> {
  const server = await mcpRepository.getById(serverId);
  if (!server || !server.is_enabled) {
    throw new Error("MCP server not found or disabled");
  }

  const transport = server.transport || "stdio";

  // 根据传输类型选择不同的调用方式
  switch (transport) {
    case "stdio":
      return executeStdioMCPTool(server, toolName, args);
    case "sse":
      return executeSSEMCPTool(server, toolName, args);
    case "http":
      return executeHttpMCPTool(server, toolName, args);
    default:
      throw new Error(`Unsupported MCP transport type: ${transport}`);
  }
}

// 执行 STDIO 类型的 MCP 工具调用
async function executeStdioMCPTool(server: any, toolName: string, args: Record<string, any>): Promise<any> {
  const { spawn } = await import("child_process");

  const commandArgs = [server.script_path, ...(server.args || []), toolName, JSON.stringify(args)];

  return new Promise<any>((resolve, reject) => {
    const childProcess = spawn(server.command, commandArgs, {
      env: { ...process.env, ...server.env_vars },
      timeout: server.timeout_seconds * 1000,
    });

    let output = "";
    let errorOutput = "";

    childProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    childProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    childProcess.on("close", (code) => {
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

    childProcess.on("error", (error) => {
      reject(error);
    });
  });
}

// 执行 SSE 类型的 MCP 工具调用
async function executeSSEMCPTool(server: any, toolName: string, args: Record<string, any>): Promise<any> {
  if (!server.url) {
    throw new Error("SSE MCP server requires URL");
  }

  const response = await fetch(`${server.url}/tools/${toolName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...server.headers,
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    throw new Error(`SSE MCP request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// 执行 HTTP 类型的 MCP 工具调用
async function executeHttpMCPTool(server: any, toolName: string, args: Record<string, any>): Promise<any> {
  if (!server.url) {
    throw new Error("HTTP MCP server requires URL");
  }

  const response = await fetch(`${server.url}/tools/${toolName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...server.headers,
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    throw new Error(`HTTP MCP request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// ========== Step 1: 获取 MCP 列表和用户传入的 MCP，返回工具 ==========

// 获取可用的 MCP 服务器列表
async function getAvailableMCPServers() {
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

    const servers = enabledServers.servers;
    return servers;
  } catch (error) {
    console.error("Failed to get available MCP servers:", error);
    return [];
  }
}

// 根据用户传入的 MCP 名称筛选可用的 MCP 服务器
async function filterMCPServers(availableServers: MCPServerListItem[], userSelectedMCPs?: string[]): Promise<MCPServerListItem[]> {
  if (!userSelectedMCPs || userSelectedMCPs.length === 0) {
    // 如果用户没有指定，返回空数组
    return [];
  }

  // 筛选用户选择的 MCP（必须在可用列表中）
  const filtered = availableServers.filter((server) => userSelectedMCPs.includes(server.name));

  return filtered;
}

// AI 模型完整配置接口
interface AIModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

// ========== Step 2: 获取 Model ==========

// 从配置中获取完整的 AI 模型配置
async function getAIModelConfig(settings: Record<string, any>): Promise<AIModelConfig> {
  try {
    // const result = await SettingsRepository.getSettingsByKeys(["ai_provider", "ai_model", "ai_api_key", "ai_api_base_url", "ai_temperature", "ai_max_tokens"]);
    // const [provider, model, apiKey, baseUrl, temperature, maxTokens] = result.map((s) => s.value);
    // const [provider, model, apiKey, baseUrl, temperature, maxTokens] = await Promise.all([
    //   SettingsRepository.getSettingValue("ai_provider", "openai"),
    //   SettingsRepository.getSettingValue("ai_model", "gpt-3.5-turbo"),
    //   SettingsRepository.getSettingValue("ai_api_key", ""),
    //   SettingsRepository.getSettingValue("ai_api_base_url", ""),
    //   SettingsRepository.getSettingValue("ai_temperature", 0.7),
    //   SettingsRepository.getSettingValue("ai_max_tokens", 2048),
    // ]);
    const {
      ai_provider: provider,
      ai_model: model,
      ai_api_key: apiKey,
      ai_api_base_url: baseUrl,
      ai_temperature: temperature,
      ai_max_tokens: maxTokens,
    } = settings;

    return {
      provider,
      model,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens, 10),
    };
  } catch (error) {
    console.error("Failed to get AI model config:", error);
    // 返回默认配置
    return {
      provider: "openai",
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 2048,
    };
  }
}

// 获取 Model
function getModel(config: AIModelConfig) {
  const { provider, model, apiKey, baseUrl } = config;
  const configuration: ClientOptions = {
    apiKey,
    baseURL: baseUrl || undefined,
  };

  const chatModel = new ChatOpenAI({
    openAIApiKey: apiKey,
    configuration,
    modelName: model,
    streaming: true,
  });
  return chatModel;
}

// 验证请求体
function validateRequest(body: any): {
  valid: boolean;
  error?: string;
  data?: {
    messages: Array<{ role: string; content: string }>;
    mcpServers?: string[];
    articleContext?: { title: string; content: string };
    stream?: boolean;
  };
} {
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return { valid: false, error: "缺少 messages 参数或格式不正确" };
  }

  // 过滤有效消息
  const messages = body.messages.filter((m: any) => m && typeof m === "object" && m.role && m.content);

  if (messages.length === 0) {
    return { valid: false, error: "messages 中没有有效的消息" };
  }

  return {
    valid: true,
    data: {
      messages,
      mcpServers: body.mcpServers,
      stream: body.stream,
    },
  };
}

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "方法不允许",
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

    const { messages, mcpServers: userMCPs, articleContext, stream } = validation.data!;

    const settings = await SettingsRepository.getAISettings();

    // 检查 AI 是否启用
    if (!settings.ai_enabled) {
      return res.status(400).json({
        success: false,
        message: "AI 功能未启用",
      });
    }

    // 检查 API Key
    if (!settings.ai_api_key) {
      return res.status(400).json({
        success: false,
        message: "AI API 密钥未配置",
      });
    }

    let contextText = "";
    if (articleContext) {
      // Article-specific context - user is viewing an article
      contextText = `

当前用户正在阅读的文章：
标题：${articleContext.title}

文章内容：
${articleContext.content}

请根据上述文章内容来回答用户的问题。如果用户的问题与文章无关，也可以友好地回答，但优先关注文章相关的问题。`;
    } else {
      // General context - fetch recent blog posts
      // const blogContext = await getBlogContext();
      // if (blogContext.length > 0) {
      //   contextText = `\n\n博客最近文章:\n${blogContext.map((p) => `- ${p.title}: ${p.excerpt}`).join("\n")}`;
      // }
    }
    const systemPrompt = (settings.ai_assistant_system_prompt || "你是一个友好的博客AI助手。") + contextText;

    // Step 1: 获取可用的 MCP 服务器列表
    const availableMCPServers = await getAvailableMCPServers();
    console.log(`[AI Chat] 可用 MCP 服务器: ${availableMCPServers.map((s) => s.name).join(", ") || "无"}`);

    // 筛选用户选择的 MCP 服务器（如果在可用列表中）
    const selectedMCPServers = await filterMCPServers(availableMCPServers, userMCPs);
    console.log(`[AI Chat] 用户选择的 MCP: ${userMCPs?.join(", ") || "全部"}`);
    console.log(`[AI Chat] 最终使用的 MCP: ${selectedMCPServers.map((s) => s.name).join(", ") || "无"}`);

    // Step 2: 从配置获取 Model（不再依赖前端传入）
    const modelConfig = await getAIModelConfig(settings);
    console.log(modelConfig);
    const languageModel = getModel(modelConfig);
    console.log(`[AI Chat] 使用模型: ${modelConfig.provider} / ${modelConfig.model}`);

    // Step 3: 生成 Agent 工具
    const tools = await generateAgentTools(selectedMCPServers);
    console.log(`[AI Chat] 可用工具数量: ${Object.keys(tools).length}`);

    // 调用 AI 生成回复
    const agent = await createAgent({
      model: languageModel,
      systemPrompt,
      tools,
    });
    // const result = await agent.invoke({
    //   messages,
    // });
    // const result = await generateText({
    //   model: languageModel,
    //   messages: messages.map((m) => ({
    //     role: m.role as "user" | "assistant" | "system",
    //     content: m.content,
    //   })),
    //   system: systemPrompt,
    //   tools: Object.keys(tools).length > 0 ? tools : undefined,
    //   maxSteps: 10,
    //   temperature: modelConfig.temperature,
    //   maxTokens: modelConfig.maxTokens,
    // });

    // 返回结果
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    const respoenStream = await agent.stream({ messages }, { streamMode: "messages" });
    for await (const chunk of respoenStream) {      
      const data = chunk[0];
      if (data) {
        // 直接写入响应
        res.write(`data: ${JSON.stringify({ content: data.content, toolCalls: data.toolCalls })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "AI 对话失败",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
async function generateAgentTools(selectedMCPServers: MCPServerListItem[]) {
  if (selectedMCPServers.length === 0) {
    return [];
  }
  const mcpClientConfig = {};
  for (const server of selectedMCPServers) {
    switch (server.transport) {
      case "http": {
        mcpClientConfig[server.name] = {
          transport: "http",
          url: server.url,
          headers: server.headers || {},
        };
        break;
      }
      case "sse": {
        mcpClientConfig[server.name] = {
          transport: "sse",
          url: server.url,
          headers: server.headers || {},
        };
        break;
      }
      case "stdio": {
        mcpClientConfig[server.name] = {
          transport: "stdio",
          command: server.command,
          args: [server.scriptPath, ...(server.args || [])].filter(Boolean),
        };
        break;
      }
      default:
        break;
    }
  }
  const client = new MultiServerMCPClient(mcpClientConfig);
  const tools = await client.getTools();
  return tools;
}
