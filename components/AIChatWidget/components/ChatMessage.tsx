'use client';

import React, { useState, useCallback } from 'react';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import CodeBlock from './CodeBlock';
import TaskListItem from './TaskListItem';
import ToolCallCard from './ToolCallCard';
import type { Message } from '../../../types/ai-chat';

interface ChatMessageProps {
  message: Message;
  onCopy?: () => void;
  onRegenerate?: () => void;
  showActions?: boolean;
  isLastAssistant?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onCopy, 
  onRegenerate, 
  showActions = true,
  isLastAssistant = false 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    }
  }, [message.content, onCopy]);

  return (
    <div
      className={`ai-message ${message.role === 'user' ? 'user' : 'assistant'}`}
    >
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="ai-tool-calls">
          {message.toolCalls.map((toolCall) => (
            <ToolCallCard key={toolCall.id} toolCall={toolCall} />
          ))}
        </div>
      )}
      <div className="ai-message-content">
        {message.role === 'assistant' ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ReactMarkdown as any)({
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeRaw, rehypeHighlight],
            children: message.content,
          })
        ) : (
          message.content
        )}
      </div>
      {showActions && message.role === 'assistant' && message.content && (
        <div className="ai-message-actions">
          <button 
            className="ai-message-action-btn" 
            onClick={handleCopy}
            title="复制内容"
          >
            {copied ? '✓ 已复制' : '📋 复制'}
          </button>
          {isLastAssistant && onRegenerate && (
            <button 
              className="ai-message-action-btn" 
              onClick={onRegenerate}
              title="重新生成"
            >
              🔄 重新生成
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
