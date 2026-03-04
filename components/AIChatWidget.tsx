import React, { useState, useEffect, useRef } from 'react';
import { useArticle, ArticleContextData } from '../contexts/ArticleContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIConfig {
  ai_available: boolean;
  ai_assistant_enabled: boolean;
  ai_assistant_name: string;
  ai_assistant_avatar: string;
  ai_assistant_welcome: string;
}

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

  // Get current article context
  const { article } = useArticle();
  const suggestions = article ? getArticleSuggestions(article) : [];

  useEffect(() => {
    fetchConfig();
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          // Include article context if available
          articleContext: article ? {
            id: article.id,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            author: article.author_name,
            tags: article.tags?.map(t => t.name) || [],
          } : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.reply,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
            <button className="ai-chat-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
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
                <div className="ai-message-content">
                  {msg.content}
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
                      disabled={loading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="ai-message assistant">
                <div className="ai-message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={article ? "关于这篇文章，你想问什么？" : "输入消息..."}
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              发送
            </button>
          </div>
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
      `}</style>
    </>
  );
};

export default AIChatWidget;
