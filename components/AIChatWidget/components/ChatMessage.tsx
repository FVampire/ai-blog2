"use client";

import React, { useState, useCallback } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { previewRehypePlugins } from "../../../lib/markdown/plugins";

import CodeBlock from "./CodeBlock";
import { BotIcon, CheckIcon, CopyIcon, UserIcon } from "./Icons";
import ToolCallCard from "./ToolCallCard";
import type { Message } from "../../../types/ai-chat";

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
  onRegenerate,
  showActions = true,
  isStreaming = false,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isEmpty = !message.content.trim();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [message.content, onCopy]);

  return (
    <div className={`ai-message ${isUser ? "user" : "assistant"}`}>
      <div className="ai-message-avatar" aria-hidden>
        {isUser ? <UserIcon size={14} /> : <BotIcon size={14} />}
      </div>
      <div className="ai-message-body">
        {message.context && (
          <div className="ai-message-context">
            {message.context.mode === "article"
              ? message.context.title
              : message.context.mode === "site"
                ? "全站文章"
                : "普通对话"}
          </div>
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="ai-tool-calls">
            {message.toolCalls.map((toolCall) => (
              <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
        <div
          className={`ai-message-content ${isEmpty && isStreaming ? "typing" : ""}`}
        >
          {isEmpty && isStreaming ? (
            <>
              <span></span>
              <span></span>
              <span></span>
            </>
          ) : isUser ? (
            message.content
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={previewRehypePlugins}
                components={{
                  pre: ({ children }) => {
                    const code = React.isValidElement<{
                      className?: string;
                      children?: React.ReactNode;
                    }>(children)
                      ? children
                      : null;
                    return (
                      <CodeBlock className={code?.props.className}>
                        {code?.props.children ?? children}
                      </CodeBlock>
                    );
                  },
                  code: ({ className, children, ...props }) => {
                    return (
                      <code
                        className={className || "ai-inline-code"}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && !isEmpty && <span className="ai-stream-cursor" />}
            </>
          )}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="ai-message-sources">
            参考文章：
            {message.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.title}
              </a>
            ))}
          </div>
        )}
        {message.warning && (
          <div className="ai-chat-notice">{message.warning}</div>
        )}
        {message.error && (
          <div className="ai-chat-notice" role="alert">
            {message.error}
          </div>
        )}
        {message.status === "stopped" && (
          <div className="ai-chat-notice">已停止生成，已保留现有内容。</div>
        )}
        {onRegenerate && !isStreaming && (
          <button
            type="button"
            className="ai-message-action-btn"
            onClick={onRegenerate}
          >
            {message.status === "error" || message.status === "stopped"
              ? "重试"
              : "重新生成"}
          </button>
        )}
        {showActions && !isUser && message.content && !isStreaming && (
          <div className="ai-message-actions">
            <button
              type="button"
              className="ai-message-action-btn"
              onClick={handleCopy}
              title={copied ? "已复制" : "复制内容"}
            >
              {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              <span>{copied ? "已复制" : "复制"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
