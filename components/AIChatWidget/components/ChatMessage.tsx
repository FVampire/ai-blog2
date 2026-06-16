import React from 'react';

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
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div
      className={`ai-message ${message.role === 'user' ? 'user' : 'assistant'}`}
    >
      {/* 工具调用展示区域 */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="ai-tool-calls">
          {message.toolCalls.map((toolCall) => (
            <ToolCallCard key={toolCall.id} toolCall={toolCall} />
          ))}
        </div>
      )}
      <div className="ai-message-content">
        {message.role === 'assistant' ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            components={{
              p: ({ children }) => <p style={{ margin: '0 0 10px 0', lineHeight: '1.7' }}>{children}</p>,
              ul: ({ children }) => <ul style={{ margin: '10px 0', paddingLeft: '22px', lineHeight: '1.8' }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: '10px 0', paddingLeft: '22px', lineHeight: '1.8' }}>{children}</ol>,
              li: ({ children, checked }) => {
                if (checked !== undefined) {
                  return <TaskListItem checked={checked}>{children}</TaskListItem>;
                }
                return <li style={{ margin: '6px 0' }}>{children}</li>;
              },
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code style={{
                      background: 'rgba(255, 107, 107, 0.12)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#FF6B6B',
                      fontFamily: "'Monaco', 'Menlo', 'Consolas', monospace"
                    }}>{children}</code>
                  );
                }
                return <CodeBlock className={className}>{children}</CodeBlock>;
              },
              h1: ({ children }) => <h1 style={{ margin: '20px 0 12px 0', fontSize: '20px', fontWeight: 'bold', borderBottom: '2px solid rgba(255, 107, 107, 0.3)', paddingBottom: '8px', color: '#2d2d2d' }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ margin: '18px 0 10px 0', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 107, 107, 0.2)', paddingBottom: '6px', color: '#2d2d2d' }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ margin: '14px 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#2d2d2d' }}>{children}</h3>,
              h4: ({ children }) => <h4 style={{ margin: '12px 0 6px 0', fontSize: '15px', fontWeight: '600', color: '#495057' }}>{children}</h4>,
              hr: () => <hr style={{ margin: '16px 0', border: 'none', borderTop: '2px dashed rgba(255, 140, 66, 0.3)' }} />,
              blockquote: ({ children }) => (
                <blockquote style={{
                  margin: '10px 0',
                  padding: '10px 16px',
                  borderLeft: '4px solid #FF6B6B',
                  background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 140, 66, 0.05))',
                  borderRadius: '0 8px 8px 0',
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>{children}</blockquote>
              ),
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" style={{
                  color: '#FF6B6B',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255, 107, 107, 0.4)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderBottomColor = '#FF6B6B';
                  e.currentTarget.style.color = '#FF8C42';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderBottomColor = 'rgba(255, 107, 107, 0.4)';
                  e.currentTarget.style.color = '#FF6B6B';
                }}
                >{children}</a>
              ),
              table: ({ children }) => (
                <div style={{ overflowX: 'auto', margin: '12px 0' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    background: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead style={{ background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 140, 66, 0.1))' }}>{children}</thead>,
              th: ({ children }) => <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid rgba(255, 107, 107, 0.2)', color: '#495057' }}>{children}</th>,
              td: ({ children }) => <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255, 140, 66, 0.1)', color: '#6b7280' }}>{children}</td>,
              strong: ({ children }) => <strong style={{ fontWeight: '600', color: '#2d2d2d' }}>{children}</strong>,
              em: ({ children }) => <em style={{ color: '#FF6B6B', fontStyle: 'italic' }}>{children}</em>,
              del: ({ children }) => <del style={{ color: '#9ca3af', textDecoration: 'line-through' }}>{children}</del>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
