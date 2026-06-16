import React from 'react';

import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import OptionsPanel from './components/OptionsPanel';
import StatusBar from './components/StatusBar';
import SuggestionChips from './components/SuggestionChips';
import { useArticle } from '../../contexts/ArticleContext';
import { useAIChat } from '../../hooks/useAIChat';

// Import the new CSS styles
import './AIChatWidget.css';

// 知识库选项
const KNOWLEDGE_BASES = [
  { id: '', name: '默认知识库', description: '使用博客文章作为知识来源' },
];

// 获取文章建议问题
const getArticleSuggestions = (article: { title: string; tags?: { name: string }[] }): string[] => {
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
  const chat = useAIChat();
  const { article } = useArticle();

  const suggestions = article ? getArticleSuggestions(article) : [];

  // 发送消息
  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || chat.input).trim();
    if (!userMessage || chat.loading || chat.isStreaming) return;

    // 检查命令
    if (userMessage.toLowerCase() === '/clear') {
      chat.setInput('');
      chat.clearContext();
      return;
    }

    if (userMessage.toLowerCase() === '/help') {
      chat.setInput('');
      const helpMessage = `## 可用命令列表\n\n` +
        chat.availableCommands.map(cmd =>
          `- **${cmd.name}** - ${cmd.description}${cmd.example ? ` (例: \`${cmd.example}\`)` : ''}`
        ).join('\n') +
        `\n\n---\n\n输入 \`/?\` 或 \`/\` 可以查看命令提示，按 **Tab** 键自动补全。`;
      chat.setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: helpMessage }
      ]);
      return;
    }

    if (userMessage.toLowerCase() === '/mcp') {
      chat.setInput('');
      chat.toggleMCP();
      const mcpStatus = !chat.useMCP ? '已启用' : '已禁用';
      chat.setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: `MCP 工具${mcpStatus}` }
      ]);
      return;
    }

    if (userMessage.toLowerCase() === '/kb') {
      chat.setInput('');
      chat.setShowOptionsPanel(!chat.showOptionsPanel);
      chat.setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: '已' + (chat.showOptionsPanel ? '关闭' : '打开') + '知识库选择面板' }
      ]);
      return;
    }

    chat.setInput('');
    chat.setShowSuggestions(false);
    chat.setShowCommandHints(false);
    chat.setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // 使用流式输出
    const useStreaming = chat.config?.ai_streaming_enabled !== false;
    if (useStreaming) {
      await sendStreamingMessage(userMessage);
    } else {
      await sendNonStreamingMessage(userMessage);
    }
  };

  // 流式发送消息
  const sendStreamingMessage = async (userMessage: string) => {
    chat.setIsStreaming(true);
    chat.setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const allMessages = [
      ...chat.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage }
    ];

    const selectedMCPNames = chat.useMCP && chat.selectedMCP
      ? [chat.mcpServers.find(s => s.id === chat.selectedMCP)?.name].filter((name): name is string => Boolean(name))
      : chat.useMCP && chat.mcpServers.length > 0
        ? chat.mcpServers.map(s => s.name)
        : undefined;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          mcpServers: selectedMCPNames,
          knowledgeBase: chat.selectedKnowledgeBase || 'vector',
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
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                chat.setMessages(prev => {
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
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('Stream error:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      chat.setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = `抱歉，出现了问题：${errorMessage}`;
        }
        return newMessages;
      });
    } finally {
      chat.setIsStreaming(false);
    }
  };

  // 非流式发送消息
  const sendNonStreamingMessage = async (userMessage: string) => {
    chat.setLoading(true);

    const allMessages = [
      ...chat.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage }
    ];

    const selectedMCPNames = chat.useMCP && chat.selectedMCP
      ? [chat.mcpServers.find(s => s.id === chat.selectedMCP)?.name].filter((name): name is string => Boolean(name))
      : chat.useMCP && chat.mcpServers.length > 0
        ? chat.mcpServers.map(s => s.name)
        : undefined;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          provider: chat.config?.ai_provider || 'anthropic',
          model: chat.config?.ai_model || 'claude-3-sonnet',
          mcpServers: selectedMCPNames,
          knowledgeBase: chat.selectedKnowledgeBase || 'vector',
          stream: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        chat.setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.content,
        }]);
      } else {
        chat.setMessages(prev => [...prev, {
          role: 'assistant',
          content: `抱歉，出现了问题：${data.message}`,
        }]);
      }
    } catch (error) {
      chat.setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，网络连接出现问题，请稍后重试。',
      }]);
    } finally {
      chat.setLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (chat.showCommandHints) {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (chat.filteredCommands.length > 0) {
          chat.autoCompleteCommand(chat.filteredCommands[chat.selectedCommandIndex]);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        chat.setSelectedCommandIndex(prev =>
          prev < chat.filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        chat.setSelectedCommandIndex(prev =>
          prev > 0 ? prev - 1 : chat.filteredCommands.length - 1
        );
        return;
      }

      if (e.key === 'Escape') {
        chat.setShowCommandHints(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chat.loading && !chat.isStreaming) {
        sendMessage();
      }
    }
  };

  // 不显示组件的情况
  if (chat.configLoading) return null;
  if (!chat.config?.ai_available || !chat.config?.ai_assistant_enabled) return null;

  const assistantName = chat.config.ai_assistant_name || 'AI助手';

  return (
    <>
      {/* 浮动按钮 */}
      <button
        className="ai-chat-toggle"
        onClick={() => chat.setIsOpen(!chat.isOpen)}
        title={chat.isOpen ? '关闭对话' : `与${assistantName}对话`}
      >
        {chat.isOpen ? '&#x2715;' : '&#x1F916;'}
      </button>

      {/* 聊天窗口 */}
      {chat.isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-avatar">&#x1F916;</span>
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
                onClick={chat.clearContext}
                disabled={chat.loading || chat.isStreaming || chat.messages.length <= 1}
                title="清空上下文"
              >
                &#x1F5D1;&#xFE0F;
              </button>
              <button className="ai-chat-close" onClick={() => chat.setIsOpen(false)}>
                &#x2715;
              </button>
            </div>
          </div>

          {/* Article context indicator */}
          {article && (
            <div className="ai-article-context">
              <span className="context-icon">&#x1F4D6;</span>
              <span className="context-text" title={article.title}>
                {article.title.length > 30 ? article.title.substring(0, 30) + '...' : article.title}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="ai-chat-messages">
            {chat.messages.map((msg, index) => (
              <ChatMessage 
                key={index} 
                message={msg} 
                isLastAssistant={msg.role === 'assistant' && index === chat.messages.length - 1}
              />
            ))}

            {/* Suggestion chips */}
            {chat.showSuggestions && article && suggestions.length > 0 && chat.messages.length <= 1 && (
              <SuggestionChips
                suggestions={suggestions}
                onSend={sendMessage}
                disabled={chat.loading || chat.isStreaming}
              />
            )}

            {/* Loading indicators */}
            {(chat.isStreaming || chat.loading) && (
              <div className="ai-message assistant">
                <div className="ai-message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={chat.messagesEndRef} />
          </div>

          {/* Options Panel */}
          <OptionsPanel
            show={chat.showOptionsPanel}
            onClose={() => chat.setShowOptionsPanel(false)}
            mcpEnabled={chat.config?.mcp_enabled}
            useMCP={chat.useMCP}
            onToggleMCP={chat.toggleMCP}
            mcpAllowUserSelect={chat.config?.mcp_allow_user_select}
            mcpServers={chat.mcpServers}
            selectedMCP={chat.selectedMCP}
            onSelectMCP={chat.setSelectedMCP}
            knowledgeBases={KNOWLEDGE_BASES}
            selectedKnowledgeBase={chat.selectedKnowledgeBase}
            onSelectKnowledgeBase={chat.selectKnowledgeBase}
          />

          {/* Chat Input */}
          <ChatInput
            input={chat.input}
            onInputChange={chat.handleInputChange}
            onSend={() => sendMessage()}
            onKeyDown={handleKeyPress}
            loading={chat.loading}
            isStreaming={chat.isStreaming}
            inputRef={chat.inputRef}
            showCommandHints={chat.showCommandHints}
            filteredCommands={chat.filteredCommands}
            selectedCommandIndex={chat.selectedCommandIndex}
            onAutoComplete={chat.autoCompleteCommand}
            onSetSelectedIndex={chat.setSelectedCommandIndex}
            onToggleOptions={() => chat.setShowOptionsPanel(!chat.showOptionsPanel)}
            hasActiveOptions={chat.useMCP || !!chat.selectedMCP || !!chat.selectedKnowledgeBase}
          />

          {/* Status Bar */}
          <StatusBar
            useMCP={chat.useMCP}
            selectedMCP={chat.selectedMCP}
            mcpServers={chat.mcpServers}
            selectedKnowledgeBase={chat.selectedKnowledgeBase}
          />
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
