import type { Source } from "../lib/ai/protocol";
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "streaming" | "complete" | "stopped" | "error";
  local?: boolean;
  error?: string;
  warning?: string;
  sources?: Source[];
  toolCalls?: ToolCall[];
  context?: {
    mode: KnowledgeMode;
    articleId?: number;
    title?: string;
    mcpServerId: number | null;
  };
}
export interface ToolCall {
  id: string;
  name: string;
  description: string;
  arguments: Record<string, unknown>;
  status: "running" | "success" | "error";
  result?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
}
export type KnowledgeMode = "none" | "article" | "site";
export interface AIConfig {
  ai_available: boolean;
  ai_assistant_enabled: boolean;
  ai_assistant_name: string;
  ai_assistant_avatar: string;
  ai_assistant_welcome: string;
  knowledge_available: boolean;
  mcp_enabled?: boolean;
  mcp_allow_user_select?: boolean;
}
export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
}
export interface Command {
  name: string;
  description: string;
  example?: string;
}
export interface MCPServer {
  id: number;
  name: string;
  description: string;
}
