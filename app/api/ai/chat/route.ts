import { NextRequest } from 'next/server';

import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI, type ClientOptions } from "@langchain/openai";
import { createAgent } from "langchain";

import { generateEmbedding } from "@/lib/embedding";
import { mcpRepository, MCPServerListItem } from "@/lib/repositories/MCPRepository";
import { SettingsRepository } from "@/lib/repositories/SettingsRepository";
import { VectorRepository } from "@/lib/repositories/VectorRepository";

interface AIModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

function validateRequest(body: any) {
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return { valid: false, error: "缺少 messages 参数或格式不正确" };
  }
  const messages = body.messages.filter((m: any) => m && typeof m === "object" && m.role && m.content);
  if (messages.length === 0) {
    return { valid: false, error: "messages 中没有有效的消息" };
  }
  return {
    valid: true,
    data: { messages, mcpServers: body.mcpServers, stream: body.stream, knowledgeBase: body.knowledgeBase },
  };
}

async function getAvailableMCPServers() {
  try {
    const mcpEnabledResult = await mcpRepository.isMCPEnabled();
    if (!mcpEnabledResult) return [];
    const enabledServers = await mcpRepository.getEnabledList();
    if (!enabledServers.enabled || enabledServers.servers.length === 0) return [];
    return enabledServers.servers;
  } catch (error) {
    console.error("Failed to get available MCP servers:", error);
    return [];
  }
}

async function filterMCPServers(availableServers: MCPServerListItem[], userSelectedMCPs?: string[]) {
  if (!userSelectedMCPs || userSelectedMCPs.length === 0) return [];
  return availableServers.filter((server) => userSelectedMCPs.includes(server.name));
}

async function getAIModelConfig(settings: Record<string, any>): Promise<AIModelConfig> {
  try {
    const { ai_provider: provider, ai_model: model, ai_api_key: apiKey, ai_api_base_url: baseUrl, ai_temperature: temperature, ai_max_tokens: maxTokens } = settings;
    return {
      provider, model,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens, 10),
    };
  } catch {
    return { provider: "openai", model: "gpt-3.5-turbo", temperature: 0.7, maxTokens: 2048 };
  }
}

function getModel(config: AIModelConfig) {
  const { apiKey, baseUrl, model } = config;
  const configuration: ClientOptions = { apiKey, baseURL: baseUrl || undefined };
  return new ChatOpenAI({ openAIApiKey: apiKey, configuration, modelName: model, streaming: true });
}

async function generateAgentTools(selectedMCPServers: MCPServerListItem[]) {
  if (selectedMCPServers.length === 0) return [];
  const mcpClientConfig: Record<string, any> = {};
  for (const server of selectedMCPServers) {
    switch (server.transport) {
      case "http":
        mcpClientConfig[server.name] = { transport: "http", url: server.url, headers: server.headers || {} };
        break;
      case "sse":
        mcpClientConfig[server.name] = { transport: "sse", url: server.url, headers: server.headers || {} };
        break;
      case "stdio":
        mcpClientConfig[server.name] = { transport: "stdio", command: server.command, args: [server.scriptPath, ...(server.args || [])].filter(Boolean) };
        break;
    }
  }
  const client = new MultiServerMCPClient(mcpClientConfig);
  return client.getTools();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, message: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages, mcpServers: userMCPs, knowledgeBase } = validation.data!;
    const settings = await SettingsRepository.getAISettings();

    if (!settings.ai_enabled) {
      return new Response(JSON.stringify({ success: false, message: "AI 功能未启用" }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!settings.ai_api_key) {
      return new Response(JSON.stringify({ success: false, message: "AI API 密钥未配置" }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    let contextText = "";
    let knowledgeContext = "";
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || "";

    if (knowledgeBase === 'vector' && lastUserMessage) {
      try {
        const queryVectors = await generateEmbedding(lastUserMessage, lastUserMessage, lastUserMessage);
        if (queryVectors) {
          const vectorResults = await VectorRepository.search(lastUserMessage, queryVectors, { limit: 5, threshold: 0.3 });
          if (vectorResults.length > 0) {
            knowledgeContext = "\n\n【相关知识库内容】:\n" + vectorResults.map((result, idx) => {
              const snippets = result.matchedSnippets?.join("\n") || result.excerpt || "";
              return `[${idx + 1}] ${result.title}\n${snippets}`;
            }).join("\n\n");
          }
        }
      } catch (kbError) {
        console.error("[AI Chat] 知识库检索失败:", kbError);
      }
    }

    const systemPrompt = (settings.ai_assistant_system_prompt || "你是一个友好的博客AI助手。") + contextText + knowledgeContext;

    const availableMCPServers = await getAvailableMCPServers();
    const selectedMCPServers = await filterMCPServers(availableMCPServers, userMCPs);
    const modelConfig = await getAIModelConfig(settings);
    const languageModel = getModel(modelConfig);
    const tools = await generateAgentTools(selectedMCPServers);

    const agent = await createAgent({ model: languageModel, systemPrompt, tools });

    // Use streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseStream = await agent.stream({ messages }, { streamMode: "messages" });
          for await (const chunk of responseStream) {
            const data = chunk[0];
            if (data) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: data.content, toolCalls: data.toolCalls })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error: any) {
          console.error("AI Chat stream error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message || "AI 对话失败" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || "AI 对话失败",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
