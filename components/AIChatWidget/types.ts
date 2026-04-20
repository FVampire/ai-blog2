// 消息类型
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

// 工具调用类型
export interface ToolCall {
  id: string;
  name: string;
  description: string;
  arguments: Record<string, any>;
  status: 'running' | 'success' | 'error';
  result?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
}

// AI 配置类型
export interface AIConfig {
  ai_available: boolean;
  ai_assistant_enabled: boolean;
  ai_assistant_name: string;
  ai_assistant_avatar: string;
  ai_assistant_welcome: string;
  ai_streaming_enabled?: boolean;
  mcp_enabled?: boolean;
  mcp_allow_user_select?: boolean;
  ai_provider?: string;
  ai_model?: string;
}

// 知识库选项
export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
}

// 支持的命令列表
export interface Command {
  name: string;
  description: string;
  example?: string;
}

// MCP 服务器
export interface MCPServer {
  id: number;
  name: string;
  description: string;
}
