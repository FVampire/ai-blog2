import React, { useState, useEffect, useRef } from 'react';
import { useArticle, ArticleContextData } from '../contexts/ArticleContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
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

interface AIConfig {
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
interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
}

// 支持的命令列表
interface Command {
  name: string;
  description: string;
  example?: string;
}

const AVAILABLE_COMMANDS: Command[] = [
  { name: '/clear', description: '清空当前对话上下文', example: '/clear' },
  { name: '/help', description: '显示所有可用命令', example: '/help' },
  { name: '/mcp', description: '切换 MCP 工具开关', example: '/mcp' },
  { name: '/kb', description: '切换知识库选择面板', example: '/kb' },
];

// Suggested questions based on article context
const getArticleSuggestions = (article: ArticleContextData): string[] => {
  const suggestions = [
    `这篇文章的主要内容是什么？`,
    `能帮我总结一下《${article.title}》吗？`,
    `这篇文章有哪些关键点？`,
  ];

  if (article.tags && article.tags.length > 0) {
    suggestions.push(`${article.tags[0].name}相关的内容还有哪些？`);
  }

  return suggestions.slice(0, 3);
};

const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // MCP 和知识库状态
  const [useMCP, setUseMCP] = useState(false);
  const [selectedMCP, setSelectedMCP] = useState<number | null>(null);
  const [mcpServers, setMCPServers] = useState<{ id: number; name: string; description: string }[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('');
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showMCPSelector, setShowMCPSelector] = useState(false);

  // 命令提示状态
  const [showCommandHints, setShowCommandHints] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 知识库列表（可以从 API 获取，这里先使用示例数据）
  const knowledgeBases: KnowledgeBase[] = [
    { id: '', name: '默认知识库', description: '使用博客文章作为知识来源' },
    { id: 'tech', name: '技术文档', description: '技术相关文档和教程' },
    { id: 'product', name: '产品手册', description: '产品使用说明和FAQ' },
    { id: 'company', name: '公司知识库', description: '公司内部文档和流程' },
  ];

  // Get current article context
  const { article } = useArticle();
  const suggestions = article ? getArticleSuggestions(article) : [];

  useEffect(() => {
    fetchConfig();
    fetchMCPServers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai/config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
        // 添加欢迎消息
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
  };

  const fetchMCPServers = async () => {
    try {
      const response = await fetch('/api/mcp/list');
      const data = await response.json();
      if (data.success && data.data.enabled) {
        setMCPServers(data.data.servers.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description
        })));
        // 如果有默认服务器，自动选择
        if (data.data.defaultServer) {
          setSelectedMCP(data.data.defaultServer.id);
        }
      }
    } catch (error) {
      console.error('Fetch MCP servers error:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 清空上下文
  const clearContext = () => {
    if (loading || isStreaming) return;

    setMessages([]);
    // 添加欢迎消息
    if (config?.ai_assistant_welcome) {
      setMessages([{
        role: 'assistant',
        content: config.ai_assistant_welcome,
      }]);
    }
    setShowSuggestions(true);
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || loading || isStreaming) return;

    // 检查是否是 /clear 命令
    if (userMessage.toLowerCase() === '/clear') {
      setInput('');
      clearContext();
      return;
    }

    // 检查是否是 /help 命令
    if (userMessage.toLowerCase() === '/help') {
      setInput('');
      const helpMessage = `## 可用命令列表\n\n` +
        AVAILABLE_COMMANDS.map(cmd =>
          `- **${cmd.name}** - ${cmd.description}${cmd.example ? ` (例: \`${cmd.example}\`)` : ''}`
        ).join('\n') +
        `\n\n---\n\n输入 \`/?\` 或 \`/\` 可以查看命令提示，按 **Tab** 键自动补全。`;
      setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: helpMessage }
      ]);
      return;
    }

    // 检查是否是 /mcp 命令
    if (userMessage.toLowerCase() === '/mcp') {
      setInput('');
      toggleMCP();
      const mcpStatus = !useMCP ? '已启用' : '已禁用';
      setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: `MCP 工具${mcpStatus}` }
      ]);
      return;
    }

    // 检查是否是 /kb 命令
    if (userMessage.toLowerCase() === '/kb') {
      setInput('');
      setShowOptionsPanel(!showOptionsPanel);
      setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: '已' + (showOptionsPanel ? '关闭' : '打开') + '知识库选择面板' }
      ]);
      return;
    }

    setInput('');
    setShowSuggestions(false);
    setShowCommandHints(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // 判断是否使用流式输出（默认启用）
    const useStreaming = config?.ai_streaming_enabled !== false;

    if (useStreaming) {
      await sendStreamingMessage(userMessage);
    } else {
      await sendNonStreamingMessage(userMessage);
    }
  };

  // 流式发送消息
  const sendStreamingMessage = async (userMessage: string) => {
    setIsStreaming(true);

    // 先添加一个空的助手消息
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    // 构建消息数组（包含历史消息和当前消息）
    const allMessages = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    // 构建系统提示词（包含文章上下文）
    let systemPrompt = '';
    if (article) {
      systemPrompt = `当前用户正在阅读文章《${article.title}》。\n\n文章摘要：${article.excerpt || '无摘要'}\n\n文章标签：${article.tags?.map(t => t.name).join(', ') || '无标签'}\n\n用户可能会询问与这篇文章相关的问题，请基于上下文回答。`;
    }

    // 获取选中的 MCP 服务器名称
    const selectedMCPNames = useMCP && selectedMCP
      ? [mcpServers.find(s => s.id === selectedMCP)?.name].filter(Boolean) as string[]
      : useMCP && mcpServers.length > 0
        ? mcpServers.map(s => s.name)
        : undefined;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          provider: config?.ai_provider || 'anthropic',
          model: config?.ai_model || 'claude-3-sonnet',
          systemPrompt: systemPrompt || undefined,
          mcpServers: selectedMCPNames,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '请求失败');
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              // 处理工具调用信息
              if (parsed.type === 'tool_calls' && parsed.toolCalls) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.toolCalls = parsed.toolCalls;
                  }
                  return newMessages;
                });
                continue;
              }

              // 处理完成标记
              if (parsed.type === 'done') {
                if (parsed.toolCalls) {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.toolCalls = parsed.toolCalls;
                    }
                    return newMessages;
                  });
                }
                break;
              }

              if (parsed.content) {
                fullContent += parsed.content;
                // 更新最后一条消息的内容
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = fullContent;
                  }
                  return newMessages;
                });
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Stream error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = error.message
            ? `抱歉，出现了问题：${error.message}`
            : '抱歉，网络连接出现问题，请稍后重试。';
        }
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // 非流式发送消息
  const sendNonStreamingMessage = async (userMessage: string) => {
    setLoading(true);

    // 构建消息数组（包含历史消息和当前消息）
    const allMessages = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    // 构建系统提示词（包含文章上下文）
    let systemPrompt = '';
    if (article) {
      systemPrompt = `当前用户正在阅读文章《${article.title}》。\n\n文章摘要：${article.excerpt || '无摘要'}\n\n文章标签：${article.tags?.map(t => t.name).join(', ') || '无标签'}\n\n用户可能会询问与这篇文章相关的问题，请基于上下文回答。`;
    }

    // 获取选中的 MCP 服务器名称
    const selectedMCPNames = useMCP && selectedMCP
      ? [mcpServers.find(s => s.id === selectedMCP)?.name].filter(Boolean) as string[]
      : useMCP && mcpServers.length > 0
        ? mcpServers.map(s => s.name)
        : undefined;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          provider: config?.ai_provider || 'anthropic',
          model: config?.ai_model || 'claude-3-sonnet',
          systemPrompt: systemPrompt || undefined,
          mcpServers: selectedMCPNames,
          stream: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.content,
          toolCalls: data.data.toolCalls,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `抱歉，出现了问题：${data.message}`,
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，网络连接出现问题，请稍后重试。',
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化，显示命令提示
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // 检测是否输入了 /
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
  };

  // 自动补全命令
  const autoCompleteCommand = (command: Command) => {
    setInput(command.name + ' ');
    setShowCommandHints(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // 命令提示的 Tab 和方向键处理
    if (showCommandHints) {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          autoCompleteCommand(filteredCommands[selectedCommandIndex]);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }

      if (e.key === 'Escape') {
        setShowCommandHints(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !isStreaming) {
        sendMessage();
      }
    }
  };

  // 切换 MCP 状态
  const toggleMCP = () => {
    setUseMCP(prev => !prev);
  };

  // 选择知识库
  const selectKnowledgeBase = (kbId: string) => {
    setSelectedKnowledgeBase(kbId);
    setShowOptionsPanel(false);
  };

  // 不显示组件的情况
  if (configLoading) return null;
  if (!config?.ai_available || !config?.ai_assistant_enabled) return null;

  const assistantName = config.ai_assistant_name || 'AI助手';

  return (
    <>
      {/* 浮动按钮 */}
      <button
        className="ai-chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? '关闭对话' : `与${assistantName}对话`}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-avatar">🤖</span>
              <div className="ai-header-info">
                <span>{assistantName}</span>
                {article && (
                  <span className="ai-context-badge">正在阅读文章</span>
                )}
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                className="ai-clear-btn"
                onClick={clearContext}
                disabled={loading || isStreaming || messages.length <= 1}
                title="清空上下文"
              >
                🗑️
              </button>
              <button className="ai-chat-close" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>
          </div>

          {/* Article context indicator */}
          {article && (
            <div className="ai-article-context">
              <span className="context-icon">📖</span>
              <span className="context-text" title={article.title}>
                {article.title.length > 30 ? article.title.substring(0, 30) + '...' : article.title}
              </span>
            </div>
          )}

          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`ai-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                {/* 工具调用展示区域 */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="ai-tool-calls">
                    {msg.toolCalls.map((toolCall) => (
                      <div key={toolCall.id} className={`ai-tool-call ${toolCall.status}`}>
                        <div className="ai-tool-call-header">
                          <span className="ai-tool-call-icon">
                            {toolCall.status === 'running' && '⏳'}
                            {toolCall.status === 'success' && '✅'}
                            {toolCall.status === 'error' && '❌'}
                          </span>
                          <span className="ai-tool-call-name">{toolCall.name}</span>
                          <span className="ai-tool-call-status">
                            {toolCall.status === 'running' && '执行中...'}
                            {toolCall.status === 'success' && '已完成'}
                            {toolCall.status === 'error' && '失败'}
                          </span>
                        </div>
                        <div className="ai-tool-call-details">
                          <div className="ai-tool-call-section">
                            <div className="ai-tool-call-section-title">输入参数</div>
                            <pre className="ai-tool-call-code">
                              {JSON.stringify(toolCall.arguments, null, 2)}
                            </pre>
                          </div>
                          {toolCall.status === 'success' && toolCall.result && (
                            <div className="ai-tool-call-section">
                              <div className="ai-tool-call-section-title">执行结果</div>
                              <pre className="ai-tool-call-code">
                                {typeof toolCall.result === 'string' && toolCall.result.length > 500
                                  ? toolCall.result.substring(0, 500) + '...'
                                  : toolCall.result}
                              </pre>
                            </div>
                          )}
                          {toolCall.status === 'error' && toolCall.error && (
                            <div className="ai-tool-call-section">
                              <div className="ai-tool-call-section-title">错误信息</div>
                              <pre className="ai-tool-call-code error">{toolCall.error}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="ai-message-content">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeHighlight]}
                      components={{
                        p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ margin: '4px 0' }}>{children}</li>,
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code style={{
                              background: 'rgba(255, 107, 107, 0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: '#FF6B6B'
                            }}>{children}</code>
                          ) : (
                            <pre style={{
                              background: '#f8f9fa',
                              padding: '12px',
                              borderRadius: '8px',
                              overflow: 'auto',
                              fontSize: '13px',
                              margin: '8px 0'
                            }}>
                              <code className={className}>{children}</code>
                            </pre>
                          );
                        },
                        h1: ({ children }) => <h1 style={{ margin: '16px 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>{children}</h1>,
                        h2: ({ children }) => <h2 style={{ margin: '14px 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>{children}</h2>,
                        h3: ({ children }) => <h3 style={{ margin: '12px 0 6px 0', fontSize: '15px', fontWeight: 'bold' }}>{children}</h3>,
                        hr: () => <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid rgba(255, 140, 66, 0.2)' }} />,
                        blockquote: ({ children }) => (
                          <blockquote style={{
                            margin: '8px 0',
                            padding: '8px 12px',
                            borderLeft: '3px solid #FF6B6B',
                            background: 'rgba(255, 107, 107, 0.05)',
                            borderRadius: '0 4px 4px 0'
                          }}>{children}</blockquote>
                        ),
                        a: ({ children, href }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" style={{
                            color: '#FF6B6B',
                            textDecoration: 'underline'
                          }}>{children}</a>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Suggestion chips - only show when article context is available */}
            {showSuggestions && article && suggestions.length > 0 && messages.length <= 1 && (
              <div className="ai-suggestions">
                <div className="suggestions-label">试试问我：</div>
                <div className="suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-chip"
                      onClick={() => sendMessage(suggestion)}
                      disabled={loading || isStreaming}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 流式输出时的加载指示器 */}
            {isStreaming && (
              <div className="ai-message assistant">
                <div className="ai-message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            {/* 非流式加载指示器 */}
            {loading && (
              <div className="ai-message assistant">
                <div className="ai-message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 选项面板 - MCP 和知识库选择 */}
          {showOptionsPanel && (
            <div className="ai-options-panel">
              <div className="ai-options-header">
                <span>选项设置</span>
                <button
                  className="ai-options-close"
                  onClick={() => setShowOptionsPanel(false)}
                >
                  ✕
                </button>
              </div>
              <div className="ai-options-content">
                {/* MCP 开关 */}
                {config?.mcp_enabled && (
                  <div className="ai-option-item">
                    <div className="ai-option-info">
                      <span className="ai-option-label">MCP 工具</span>
                      <span className="ai-option-desc">启用 MCP 扩展功能</span>
                    </div>
                    <button
                      className={`ai-toggle-btn ${useMCP ? 'active' : ''}`}
                      onClick={toggleMCP}
                    >
                      {useMCP ? 'ON' : 'OFF'}
                    </button>
                  </div>
                )}

                {/* MCP 服务器选择 */}
                {config?.mcp_enabled && config?.mcp_allow_user_select && useMCP && mcpServers.length > 0 && (
                  <div className="ai-option-item ai-knowledge-base">
                    <span className="ai-option-label">MCP 服务器</span>
                    <div className="ai-knowledge-list">
                      {mcpServers.map((server) => (
                        <button
                          key={server.id}
                          className={`ai-knowledge-chip ${selectedMCP === server.id ? 'active' : ''}`}
                          onClick={() => setSelectedMCP(server.id)}
                          title={server.description}
                        >
                          {server.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 知识库选择 */}
                <div className="ai-option-item ai-knowledge-base">
                  <span className="ai-option-label">知识库</span>
                  <div className="ai-knowledge-list">
                    {knowledgeBases.map((kb) => (
                      <button
                        key={kb.id}
                        className={`ai-knowledge-chip ${selectedKnowledgeBase === kb.id ? 'active' : ''}`}
                        onClick={() => selectKnowledgeBase(kb.id)}
                        title={kb.description}
                      >
                        {kb.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="ai-chat-input">
            {/* 选项按钮 */}
            <button
              className={`ai-options-toggle ${useMCP || selectedMCP || selectedKnowledgeBase ? 'active' : ''}`}
              onClick={() => setShowOptionsPanel(!showOptionsPanel)}
              title="选项设置"
            >
              ⚙️
            </button>

            {/* 命令提示下拉框 */}
            {showCommandHints && (
              <div className="ai-command-hints">
                <div className="ai-command-hints-header">
                  <span>可用命令</span>
                  <span className="ai-command-hints-shortcut">Tab 补全 · ↑↓ 选择 · Esc 关闭</span>
                </div>
                {filteredCommands.map((cmd, index) => (
                  <div
                    key={cmd.name}
                    className={`ai-command-item ${index === selectedCommandIndex ? 'selected' : ''}`}
                    onClick={() => autoCompleteCommand(cmd)}
                    onMouseEnter={() => setSelectedCommandIndex(index)}
                  >
                    <span className="ai-command-name">{cmd.name}</span>
                    <span className="ai-command-desc">{cmd.description}</span>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={article ? "关于这篇文章，你想问什么？(输入 / 查看命令)" : "输入消息... (输入 / 查看命令)"}
              disabled={loading || isStreaming}
            />
            <button onClick={() => sendMessage()} disabled={loading || isStreaming || !input.trim()}>
              {isStreaming ? '生成中...' : '发送'}
            </button>
          </div>

          {/* 快捷状态显示 */}
          {(useMCP || selectedMCP || selectedKnowledgeBase) && (
            <div className="ai-status-bar">
              {useMCP && (
                <span className="ai-status-tag mcp">
                  🔧 MCP 已启用
                </span>
              )}
              {useMCP && selectedMCP && (
                <span className="ai-status-tag mcp-server">
                  🔌 {mcpServers.find(s => s.id === selectedMCP)?.name || 'MCP服务器'}
                </span>
              )}
              {selectedKnowledgeBase && (
                <span className="ai-status-tag kb">
                  📚 {knowledgeBases.find(kb => kb.id === selectedKnowledgeBase)?.name || '知识库'}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .ai-chat-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
          color: white;
          border: 3px solid rgba(255, 255, 255, 0.3);
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(255, 107, 107, 0.4);
          transition: all 0.3s ease;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-chat-toggle:hover {
          transform: scale(1.1) rotate(10deg);
          box-shadow: 0 8px 30px rgba(255, 107, 107, 0.5);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .ai-chat-window {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 380px;
          height: 520px;
          background: linear-gradient(135deg, #FFF5F0, #FFE8DD);
          border-radius: 20px;
          border: 2px solid rgba(255, 140, 66, 0.2);
          box-shadow: 0 10px 40px rgba(255, 140, 66, 0.2);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow: hidden;
        }

        .ai-chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
          color: white;
        }

        .ai-chat-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Instrument Serif', serif;
          font-style: italic;
          font-weight: 400;
          font-size: 18px;
        }

        .ai-avatar {
          font-size: 24px;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .ai-chat-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .ai-chat-close:hover {
          background: rgba(255, 255, 255, 0.4);
          transform: rotate(90deg);
        }

        .ai-header-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ai-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-clear-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .ai-clear-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }

        .ai-clear-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .ai-context-badge {
          font-size: 10px;
          font-style: normal;
          font-family: 'Inter', sans-serif;
          background: rgba(255, 255, 255, 0.25);
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 500;
        }

        .ai-article-context {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 140, 66, 0.1));
          border-bottom: 1px solid rgba(255, 140, 66, 0.15);
          font-size: 12px;
          color: #495057;
        }

        .context-icon {
          font-size: 14px;
        }

        .context-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
          color: #FF6B6B;
        }

        .ai-suggestions {
          padding: 12px;
          animation: fadeIn 0.3s ease;
        }

        .suggestions-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
          font-family: 'Inter', sans-serif;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .suggestion-chip {
          background: white;
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 16px;
          padding: 8px 14px;
          font-size: 13px;
          color: #495057;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .suggestion-chip:hover {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
          color: white;
          border-color: transparent;
          transform: translateX(4px);
        }

        .suggestion-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(255, 255, 255, 0.5);
        }

        .ai-chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .ai-chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .ai-chat-messages::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #FF6B6B, #FF8C42);
          border-radius: 999px;
        }

        .ai-message {
          max-width: 85%;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-message.user {
          align-self: flex-end;
        }

        .ai-message.assistant {
          align-self: flex-start;
        }

        .ai-message-content {
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: 'Inter', sans-serif;
        }

        .ai-message.user .ai-message-content {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
        }

        .ai-message.assistant .ai-message-content {
          background: white;
          color: #495057;
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255, 140, 66, 0.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .ai-message-content.typing {
          display: flex;
          gap: 5px;
          padding: 16px 20px;
        }

        .ai-message-content.typing span {
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #FF6B6B, #FF8C42);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }

        .ai-message-content.typing span:nth-child(1) { animation-delay: 0s; }
        .ai-message-content.typing span:nth-child(2) { animation-delay: 0.2s; }
        .ai-message-content.typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }

        .ai-chat-input {
          display: flex;
          gap: 10px;
          padding: 16px;
          background: linear-gradient(135deg, #FFF5F0, #FFE8DD);
          border-top: 1px solid rgba(255, 140, 66, 0.15);
          position: relative;
        }

        /* 命令提示下拉框样式 */
        .ai-command-hints {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 56px;
          right: 80px;
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(255, 140, 66, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          overflow: hidden;
          animation: slideUp 0.2s ease;
        }

        .ai-command-hints-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 140, 66, 0.05));
          border-bottom: 1px solid rgba(255, 140, 66, 0.1);
          font-size: 12px;
          color: #6b7280;
          font-family: 'Inter', sans-serif;
        }

        .ai-command-hints-shortcut {
          font-size: 11px;
          color: #FF8C42;
          font-weight: 500;
        }

        .ai-command-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          border-bottom: 1px solid rgba(255, 140, 66, 0.05);
        }

        .ai-command-item:last-child {
          border-bottom: none;
        }

        .ai-command-item:hover,
        .ai-command-item.selected {
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 140, 66, 0.1));
        }

        .ai-command-name {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #FF6B6B;
          min-width: 60px;
        }

        .ai-command-desc {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #6b7280;
          flex: 1;
        }

        .ai-chat-input input {
          flex: 1;
          padding: 12px 18px;
          border: 2px solid rgba(255, 140, 66, 0.2);
          border-radius: 20px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          background: white;
          transition: all 0.3s ease;
        }

        .ai-chat-input input:focus {
          border-color: #FF8C42;
          box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.1);
        }

        .ai-chat-input input::placeholder {
          color: #FFAB73;
        }

        .ai-chat-input button {
          padding: 12px 20px;
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
          color: white;
          border: none;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
        }

        .ai-chat-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .ai-chat-input button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        }

        /* 选项面板样式 */
        .ai-options-panel {
          background: white;
          border-top: 1px solid rgba(255, 140, 66, 0.15);
          border-bottom: 1px solid rgba(255, 140, 66, 0.15);
          padding: 12px 16px;
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-options-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 500;
          color: #495057;
          font-size: 14px;
        }

        .ai-options-close {
          background: rgba(255, 107, 107, 0.1);
          border: none;
          color: #FF6B6B;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .ai-options-close:hover {
          background: rgba(255, 107, 107, 0.2);
          transform: rotate(90deg);
        }

        .ai-options-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ai-option-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .ai-option-item.ai-knowledge-base {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .ai-option-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ai-option-label {
          font-weight: 500;
          color: #495057;
          font-size: 13px;
        }

        .ai-option-desc {
          font-size: 11px;
          color: #6b7280;
        }

        .ai-toggle-btn {
          padding: 6px 12px;
          border-radius: 12px;
          border: 2px solid rgba(255, 140, 66, 0.2);
          background: white;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 50px;
        }

        .ai-toggle-btn.active {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
          border-color: transparent;
          color: white;
        }

        .ai-knowledge-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ai-knowledge-chip {
          padding: 6px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 140, 66, 0.3);
          background: white;
          color: #495057;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ai-knowledge-chip:hover {
          border-color: #FF8C42;
          transform: translateY(-1px);
        }

        .ai-knowledge-chip.active {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
          border-color: transparent;
          color: white;
        }

        /* 选项按钮样式 */
        .ai-options-toggle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(255, 140, 66, 0.2);
          background: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-options-toggle:hover {
          border-color: #FF8C42;
          transform: scale(1.05);
        }

        .ai-options-toggle.active {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
          border-color: transparent;
        }

        /* 状态栏样式 */
        .ai-status-bar {
          display: flex;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 245, 240, 0.8);
          border-top: 1px solid rgba(255, 140, 66, 0.1);
          flex-wrap: wrap;
        }

        .ai-status-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .ai-status-tag.mcp {
          background: rgba(255, 107, 107, 0.15);
          color: #FF6B6B;
        }

        .ai-status-tag.kb {
          background: rgba(66, 133, 244, 0.15);
          color: #4285F4;
        }

        @media (max-width: 480px) {
          .ai-chat-window {
            width: calc(100vw - 32px);
            height: calc(100vh - 120px);
            bottom: 88px;
            right: 16px;
          }

          .ai-chat-toggle {
            bottom: 16px;
            right: 16px;
          }
        }

        /* 工具调用展示样式 */
        .ai-tool-calls {
          margin-bottom: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ai-tool-call {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ai-tool-call:hover {
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
        }

        .ai-tool-call.running {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1));
          border-color: rgba(251, 191, 36, 0.3);
          animation: pulse 2s infinite;
        }

        .ai-tool-call.success {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1));
          border-color: rgba(34, 197, 94, 0.3);
        }

        .ai-tool-call.error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
          border-color: rgba(239, 68, 68, 0.3);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .ai-tool-call-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .ai-tool-call-icon {
          font-size: 14px;
        }

        .ai-tool-call-name {
          font-weight: 600;
          color: #4F46E5;
          font-family: 'Inter', sans-serif;
          flex: 1;
        }

        .ai-tool-call.running .ai-tool-call-name {
          color: #D97706;
        }

        .ai-tool-call.success .ai-tool-call-name {
          color: #16A34A;
        }

        .ai-tool-call.error .ai-tool-call-name {
          color: #DC2626;
        }

        .ai-tool-call-status {
          font-size: 11px;
          color: #6B7280;
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 10px;
        }

        .ai-tool-call-details {
          border-top: 1px solid rgba(99, 102, 241, 0.1);
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ai-tool-call-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ai-tool-call-section-title {
          font-size: 10px;
          color: #6B7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ai-tool-call-code {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 6px;
          padding: 8px;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 11px;
          color: #374151;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
        }

        .ai-tool-call-code.error {
          background: rgba(239, 68, 68, 0.05);
          color: #DC2626;
        }
      `}</style>
    </>
  );
};

export default AIChatWidget;
