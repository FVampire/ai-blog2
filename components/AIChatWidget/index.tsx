'use client';

import React, { useCallback, useEffect, useRef } from 'react';

import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import { BookIcon, BotIcon, CloseIcon, TrashIcon } from './components/Icons';
import OptionsPanel from './components/OptionsPanel';
import StatusBar from './components/StatusBar';
import SuggestionChips from './components/SuggestionChips';
import { getArticleSuggestions, KNOWLEDGE_BASES } from './constants';
import { useArticle } from '../../contexts/ArticleContext';
import { useAIChat } from '../../hooks/useAIChat';

import './AIChatWidget.css';

const AIChatWidget: React.FC = () => {
  const chat = useAIChat();
  const { article } = useArticle();
  const abortRef = useRef<AbortController | null>(null);

  const suggestions = article ? getArticleSuggestions(article) : [];

  const inputRef = chat.inputRef;
  useEffect(() => {
    if (!chat.isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [chat.isOpen, inputRef]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    chat.setIsStreaming(false);
    chat.setLoading(false);
    chat.setMessages(prev => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === 'assistant' && !last.content.trim()) {
        next.pop();
      }
      return next;
    });
  }, [chat]);

  const {
    isOpen,
    showCommandHints,
    showOptionsPanel,
    setShowCommandHints,
    setShowOptionsPanel,
    setIsOpen,
  } = chat;

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showCommandHints) {
        setShowCommandHints(false);
        return;
      }
      if (showOptionsPanel) {
        setShowOptionsPanel(false);
        return;
      }
      setIsOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isOpen,
    showCommandHints,
    showOptionsPanel,
    setShowCommandHints,
    setShowOptionsPanel,
    setIsOpen,
  ]);

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || chat.input).trim();
    if (!userMessage || chat.loading || chat.isStreaming) return;

    if (userMessage.toLowerCase() === '/clear') {
      chat.setInput('');
      chat.clearContext();
      return;
    }

    if (userMessage.toLowerCase() === '/help') {
      chat.setInput('');
      const helpMessage = `## 可用命令\n\n` +
        chat.availableCommands.map(cmd =>
          `- **${cmd.name}** — ${cmd.description}${cmd.example ? `（例：\`${cmd.example}\`）` : ''}`
        ).join('\n') +
        `\n\n输入 \`/\` 可查看命令提示，按 **Tab** 自动补全。`;
      chat.setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: helpMessage }
      ]);
      return;
    }

    if (userMessage.toLowerCase() === '/mcp') {
      chat.setInput('');
      chat.toggleMCP();
      const mcpStatus = !chat.useMCP ? '已启用' : '已关闭';
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
        { role: 'assistant', content: chat.showOptionsPanel ? '已关闭知识库选择面板' : '已打开知识库选择面板' }
      ]);
      return;
    }

    chat.setInput('');
    chat.setShowSuggestions(false);
    chat.setShowCommandHints(false);
    chat.setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    const useStreaming = chat.config?.ai_streaming_enabled !== false;
    if (useStreaming) {
      await sendStreamingMessage(userMessage);
    } else {
      await sendNonStreamingMessage(userMessage);
    }
  };

  const sendStreamingMessage = async (userMessage: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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
        signal: controller.signal,
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
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        streamDone = done;
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
            } catch (err) {
              if (err instanceof SyntaxError) continue;
              throw err;
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
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
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      chat.setIsStreaming(false);
    }
  };

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
    } catch {
      chat.setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，网络连接出现问题，请稍后重试。',
      }]);
    } finally {
      chat.setLoading(false);
    }
  };

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

  if (chat.configLoading) return null;
  if (!chat.config?.ai_available || !chat.config?.ai_assistant_enabled) return null;

  const assistantName = chat.config.ai_assistant_name || 'AI助手';
  const canClear = !chat.loading && !chat.isStreaming && chat.messages.length > 1;

  return (
    <>
      <button
        type="button"
        className={`ai-chat-toggle ${chat.isOpen ? 'open' : ''}`}
        onClick={() => chat.setIsOpen(!chat.isOpen)}
        title={chat.isOpen ? '关闭对话' : `与${assistantName}对话`}
        aria-label={chat.isOpen ? '关闭对话' : `打开${assistantName}`}
        aria-expanded={chat.isOpen}
      >
        {chat.isOpen ? <CloseIcon size={22} /> : <BotIcon size={24} />}
      </button>

      {chat.isOpen && (
        <div
          className="ai-chat-backdrop"
          onClick={() => chat.setIsOpen(false)}
          aria-hidden
        />
      )}

      {chat.isOpen && (
        <div className="ai-chat-window" role="dialog" aria-label={`${assistantName}对话窗口`}>
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-avatar">
                <BotIcon size={18} />
              </span>
              <div className="ai-header-info">
                <span>{assistantName}</span>
                <span className={`ai-online-dot ${chat.isStreaming || chat.loading ? 'busy' : ''}`}>
                  {chat.isStreaming || chat.loading ? '正在回复' : '在线'}
                </span>
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-clear-btn"
                onClick={chat.clearContext}
                disabled={!canClear}
                title="清空对话"
                aria-label="清空对话"
              >
                <TrashIcon size={15} />
              </button>
              <button
                type="button"
                className="ai-chat-close"
                onClick={() => chat.setIsOpen(false)}
                aria-label="关闭"
              >
                <CloseIcon size={15} />
              </button>
            </div>
          </div>

          {article && (
            <div className="ai-article-context">
              <BookIcon size={14} />
              <span className="context-text" title={article.title}>
                {article.title}
              </span>
            </div>
          )}

          <div className="ai-chat-messages">
            {chat.messages.map((msg, index) => {
              const isLast = index === chat.messages.length - 1;
              const streamingThis = chat.isStreaming && isLast && msg.role === 'assistant';
              return (
                <ChatMessage
                  key={index}
                  message={msg}
                  isLastAssistant={msg.role === 'assistant' && isLast}
                  isStreaming={streamingThis}
                />
              );
            })}

            {chat.showSuggestions && article && suggestions.length > 0 && chat.messages.length <= 1 && (
              <SuggestionChips
                suggestions={suggestions}
                onSend={sendMessage}
                disabled={chat.loading || chat.isStreaming}
              />
            )}

            {chat.loading && !chat.isStreaming && (
              <div className="ai-message assistant">
                <div className="ai-message-avatar" aria-hidden>
                  <BotIcon size={14} />
                </div>
                <div className="ai-message-body">
                  <div className="ai-message-content typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chat.messagesEndRef} />
          </div>

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

          <ChatInput
            input={chat.input}
            onInputChange={chat.handleInputChange}
            onSend={() => sendMessage()}
            onStop={stopStreaming}
            onKeyDown={handleKeyPress}
            loading={chat.loading}
            isStreaming={chat.isStreaming}
            inputRef={inputRef}
            showCommandHints={chat.showCommandHints}
            filteredCommands={chat.filteredCommands}
            selectedCommandIndex={chat.selectedCommandIndex}
            onAutoComplete={chat.autoCompleteCommand}
            onSetSelectedIndex={chat.setSelectedCommandIndex}
            onToggleOptions={() => chat.setShowOptionsPanel(!chat.showOptionsPanel)}
            hasActiveOptions={chat.useMCP || !!chat.selectedMCP || !!chat.selectedKnowledgeBase}
          />

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
