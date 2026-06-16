/**
 * AI Chat Widget 类型定义
 * 集中管理 AI 聊天相关的所有类型
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  description: string;
  arguments: Record<string, unknown>;
  status: 'running' | 'success' | 'error';
  result?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
}

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

export interface ChatState {
  isOpen: boolean;
  messages: Message[];
  input: string;
  loading: boolean;
  configLoading: boolean;
  isStreaming: boolean;
  showSuggestions: boolean;
}

export interface MCPState {
  useMCP: boolean;
  selectedMCP: number | null;
  mcpServers: MCPServer[];
}

export interface OptionsState {
  showOptionsPanel: boolean;
  selectedKnowledgeBase: string;
}

export interface CommandState {
  showCommandHints: boolean;
  filteredCommands: Command[];
  selectedCommandIndex: number;
}
