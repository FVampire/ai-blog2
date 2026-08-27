'use client';

import React, { useState, useCallback } from 'react';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import CodeBlock from './CodeBlock';
import { BotIcon, CheckIcon, CopyIcon, UserIcon } from './Icons';
import TaskListItem from './TaskListItem';
import ToolCallCard from './ToolCallCard';
import type { Message } from '../../../types/ai-chat';

interface ChatMessageProps {
  message: Message;
  onCopy?: () => void;
  onRegenerate?: () => void;
  showActions?: boolean;
  isLastAssistant?: boolean;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onCopy,
  showActions = true,
  isStreaming = false,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isEmpty = !message.content.trim();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [message.content, onCopy]);

  return (
    <div className={`ai-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="ai-message-avatar" aria-hidden>
        {isUser ? <UserIcon size={14} /> : <BotIcon size={14} />}
      </div>
      <div className="ai-message-body">
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="ai-tool-calls">
            {message.toolCalls.map((toolCall) => (
              <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
        <div className={`ai-message-content ${isEmpty && isStreaming ? 'typing' : ''}`}>
          {isEmpty && isStreaming ? (
            <>
              <span></span><span></span><span></span>
            </>
          ) : isUser ? (
            message.content
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
                components={{
                  pre: ({ children }) => <>{children}</>,
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    if (match) {
                      return <CodeBlock className={className}>{children}</CodeBlock>;
                    }
                    return <code className="ai-inline-code" {...props}>{children}</code>;
                  },
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                  ),
                  li: ({ className, checked, children, ...props }: React.ComponentPropsWithoutRef<'li'> & { checked?: boolean }) => {
                    if (typeof checked === 'boolean' || className?.includes('task-list-item')) {
                      return <TaskListItem checked={checked}>{children}</TaskListItem>;
                    }
                    return <li className={className} {...props}>{children}</li>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && !isEmpty && <span className="ai-stream-cursor" />}
            </>
          )}
        </div>
        {showActions && !isUser && message.content && !isStreaming && (
          <div className="ai-message-actions">
            <button
              type="button"
              className="ai-message-action-btn"
              onClick={handleCopy}
              title={copied ? '已复制' : '复制内容'}
            >
              {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              <span>{copied ? '已复制' : '复制'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
