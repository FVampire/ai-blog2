'use client';

import React, { useState } from 'react';

import { CheckIcon, CopyIcon } from './Icons';
import { copyToClipboard } from '../utils/helpers';

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
    <div className="ai-code-block">
      <div className="ai-code-header">
        <span>{language || 'code'}</span>
        <button
          type="button"
          className={`ai-code-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="ai-code-pre">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
