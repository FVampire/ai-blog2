'use client';

import React, { useState } from 'react';

import { copyToClipboard } from '../utils/helpers';

// 代码块组件（带复制按钮）
const CodeBlock: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    const success = await copyToClipboard(codeContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ position: 'relative', margin: '10px 0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #2d2d2d, #1a1a1a)',
        padding: '6px 12px',
        borderRadius: '8px 8px 0 0',
        fontSize: '12px',
        color: '#aaa',
        fontFamily: "'Inter', sans-serif"
      }}>
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 10px',
            color: copied ? '#22c55e' : '#fff',
            cursor: 'pointer',
            fontSize: '11px',
            transition: 'all 0.2s ease',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {copied ? '✓ 已复制' : '📋 复制'}
        </button>
      </div>
      <pre style={{
        background: '#1e1e1e',
        padding: '14px',
        borderRadius: '0 0 8px 8px',
        overflow: 'auto',
        fontSize: '13px',
        margin: 0,
        color: '#d4d4d4',
        fontFamily: "'Monaco', 'Menlo', 'Consolas', monospace",
        lineHeight: '1.6'
      }}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
