'use client';

import React, { useState } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { previewRehypePlugins } from '../lib/markdown/plugins';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '在此输入Markdown内容...'
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="markdown-editor">
      <div className="markdown-toolbar">
        <button
          type="button"
          className={`toolbar-btn ${!showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview(false)}
        >
          ✏️ 编辑
        </button>
        <button
          type="button"
          className={`toolbar-btn ${showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview(true)}
        >
          👁️ 预览
        </button>
        <div className="toolbar-divider" />
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(value + '\n## ')}
          title="标题"
        >
          H
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(value + '**粗体**')}
          title="粗体"
        >
          B
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(value + '*斜体*')}
          title="斜体"
        >
          I
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(value + '\n```\n代码块\n```')}
          title="代码块"
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(value + '\n- 列表项')}
          title="列表"
        >
          ≡
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(value + '\n> 引用')}
          title="引用"
        >
          &quot;
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(value + '\n[链接文字](URL)')}
          title="链接"
        >
          🔗
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(value + '\n![图片描述](图片URL)')}
          title="图片"
        >
          🖼️
        </button>
      </div>

      <div className="markdown-content">
        {!showPreview ? (
          <textarea
            className="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <div className="markdown-preview">
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={previewRehypePlugins}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p className="preview-empty">暂无内容，开始编写吧...</p>
            )}
          </div>
        )}
      </div>

      <div className="markdown-help">
        <details>
          <summary>Markdown 语法帮助</summary>
          <div className="help-content">
            <p><strong># 标题</strong> - 一级标题</p>
            <p><strong>## 标题</strong> - 二级标题</p>
            <p><strong>**粗体**</strong> - 粗体文字</p>
            <p><strong>*斜体*</strong> - 斜体文字</p>
            <p><strong>`代码`</strong> - 行内代码</p>
            <p><strong>```代码块```</strong> - 代码块</p>
            <p><strong>[链接](URL)</strong> - 创建链接</p>
            <p><strong>![图片](URL)</strong> - 插入图片</p>
            <p><strong>- 列表</strong> - 无序列表</p>
            <p><strong>1. 列表</strong> - 有序列表</p>
            <p><strong>&gt; 引用</strong> - 引用文字</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default MarkdownEditor;
