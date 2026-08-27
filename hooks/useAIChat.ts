import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';

import { useArticle } from '../contexts/ArticleContext';
import type { Message, AIConfig, MCPServer, Command } from '../types/ai-chat';

const AVAILABLE_COMMANDS: Command[] = [
  { name: '/clear', description: '清空当前对话上下文', example: '/clear' },
  { name: '/help', description: '显示所有可用命令', example: '/help' },
  { name: '/mcp', description: '切换 MCP 工具开关', example: '/mcp' },
  { name: '/kb', description: '切换知识库选择面板', example: '/kb' },
];

export function useAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  // MCP 和知识库状态
  const [useMCP, setUseMCP] = useState(false);
  const [selectedMCP, setSelectedMCP] = useState<number | null>(null);
  const [mcpServers, setMCPServers] = useState<MCPServer[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('');
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);

  // 命令提示状态
  const [showCommandHints, setShowCommandHints] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Session history for regeneration
  const [sessionHistory, setSessionHistory] = useState<Message[][]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get current article context
  const { article } = useArticle();

  // Fetch AI config
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
        if (data.data.ai_assistant_welcome) {
          setMessages([{
            role: 'assistant',
            content: data.data.ai_assistant_welcome,
          }]);
        }
      }
    } catch (error) {
      console.error('Fetch AI config error:', error);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // Fetch MCP servers
  const fetchMCPServers = useCallback(async () => {
    try {
      const response = await fetch('/api/mcp/list');
      const data = await response.json();
      if (data.success && data.data.enabled) {
        setMCPServers(data.data.servers.map((s: { id: number; name: string; description: string }) => ({
          id: s.id,
          name: s.name,
          description: s.description
        })));
        if (data.data.defaultServer) {
          setSelectedMCP(data.data.defaultServer.id);
        }
      }
    } catch (error) {
      console.error('Fetch MCP servers error:', error);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchMCPServers();
  }, [fetchConfig, fetchMCPServers]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Clear context
  const clearContext = useCallback(() => {
    if (loading || isStreaming) return;
    setMessages([]);
    if (config?.ai_assistant_welcome) {
      setMessages([{
        role: 'assistant',
        content: config.ai_assistant_welcome,
      }]);
    }
    setShowSuggestions(true);
    setSessionHistory([]);
  }, [config, loading, isStreaming]);

  // Save current session to history
  const saveSessionToHistory = useCallback(() => {
    if (messages.length > 1) {
      setSessionHistory(prev => [...prev, [...messages]]);
    }
  }, [messages]);

  // Restore session from history
  const restoreSessionFromHistory = useCallback((index: number) => {
    if (index >= 0 && index < sessionHistory.length) {
      setMessages(sessionHistory[index]);
    }
  }, [sessionHistory]);

  // Toggle MCP
  const toggleMCP = useCallback(() => {
    setUseMCP(prev => !prev);
  }, []);

  // Select knowledge base
  const selectKnowledgeBase = useCallback((kbId: string) => {
    setSelectedKnowledgeBase(kbId);
    setShowOptionsPanel(false);
  }, []);

  // Handle input change with command hints
  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.startsWith('/')) {
      const query = value.slice(1).toLowerCase();
      const filtered = AVAILABLE_COMMANDS.filter(cmd =>
        cmd.name.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query)
      );
      setFilteredCommands(filtered);
      setShowCommandHints(filtered.length > 0);
      setSelectedCommandIndex(0);
    } else {
      setShowCommandHints(false);
    }
  }, []);

  // Auto-complete command
  const autoCompleteCommand = useCallback((command: Command) => {
    setInput(command.name + ' ');
    setShowCommandHints(false);
    inputRef.current?.focus();
  }, []);

  return {
    // State
    isOpen,
    setIsOpen,
    config,
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    configLoading,
    showSuggestions,
    setShowSuggestions,
    isStreaming,
    setIsStreaming,
    // MCP
    useMCP,
    setUseMCP,
    selectedMCP,
    setSelectedMCP,
    mcpServers,
    setMCPServers,
    selectedKnowledgeBase,
    setSelectedKnowledgeBase,
    showOptionsPanel,
    setShowOptionsPanel,
    // Commands
    showCommandHints,
    setShowCommandHints,
    filteredCommands,
    selectedCommandIndex,
    setSelectedCommandIndex,
    availableCommands: AVAILABLE_COMMANDS,
    // Refs
    messagesEndRef,
    inputRef,
    // Context
    article,
    // Actions
    clearContext,
    toggleMCP,
    selectKnowledgeBase,
    handleInputChange,
    autoCompleteCommand,
    fetchConfig,
    fetchMCPServers,
    scrollToBottom,
    // Session history
    sessionHistory,
    saveSessionToHistory,
    restoreSessionFromHistory,
  };
}
