'use client';

import { useEffect, useState } from 'react';
import { getTool } from '@/lib/tools/registry';
import { copyRichHtml, copyText } from '@/lib/tools/clipboard';
import { downloadTextFile } from '@/lib/tools/download';
import { inlineHtml, renderMarkdown, standaloneHtml } from '@/lib/tools/markdown/render';
import { themeCss } from '@/lib/tools/markdown/themes';
import ToolShell from '@/components/tools/ToolShell';
import shared from '@/components/tools/tools-shared.module.css';
import styles from './markdown.module.css';

const SAMPLE = `# Markdown 工具箱\n\n把 **Markdown** 变成可以发布的 HTML。\n\n> 预览与导出使用同一条渲染管线。\n\n## 功能清单\n\n- [x] GFM 表格与任务列表\n- [x] 代码高亮\n- [x] 普通 / 霓虹主题\n\n| 模式 | 用途 |\n| --- | --- |\n| 普通 | 文档与邮件 |\n| 霓虹 | 技术内容与展示 |\n\n\`\`\`js\nconst message = 'Hello, tools!';\nconsole.log(message);\n\`\`\``;

const THEMES = [
  { key: 'plain', label: '普通文档' },
  { key: 'neon', label: '霓虹暗色' },
] as const;

export default function MarkdownTool() {
  const meta = getTool('markdown-to-html')!;
  const [markdown, setMarkdown] = useState(SAMPLE);
  const [html, setHtml] = useState('');
  const [theme, setTheme] = useState<'plain' | 'neon'>('plain');
  const [allowHtml, setAllowHtml] = useState(false);
  const [sanitize, setSanitize] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('tool-draft:markdown-to-html');
    if (saved) setMarkdown(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('tool-draft:markdown-to-html', markdown);
    const timer = window.setTimeout(
      () => renderMarkdown(markdown, { allowHtml, sanitize })
        .then((value) => { setHtml(value); setError(''); })
        .catch((reason) => setError(String(reason))),
      160,
    );
    return () => window.clearTimeout(timer);
  }, [allowHtml, markdown, sanitize]);

  const done = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1600);
  };

  const full = standaloneHtml(html, theme);
  const inline = inlineHtml(html, theme);

  return (
    <ToolShell meta={meta}>
      <section className={shared.workspace}>
        <div className={shared.toolbar}>
          <div className={shared.field}>
            主题
            <div className={shared.segmented} role="group" aria-label="预览主题">
              {THEMES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`${shared.segment} ${theme === item.key ? shared.segmentActive : ''}`}
                  onClick={() => setTheme(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className={shared.switch}>
            <input
              type="checkbox"
              checked={allowHtml}
              onChange={(event) => setAllowHtml(event.target.checked)}
            />
            允许原始 HTML
          </label>

          <label className={shared.switch}>
            <input
              type="checkbox"
              checked={sanitize}
              onChange={(event) => setSanitize(event.target.checked)}
            />
            XSS 清洗
          </label>

          <button
            className={`${shared.button} ${shared.toolbarSpacer}`}
            onClick={() => setMarkdown(SAMPLE)}
          >
            载入示例
          </button>
        </div>

        {allowHtml && !sanitize && (
          <p className={shared.warning}>
            原始 HTML 与清洗同时关闭会执行危险标记。请勿粘贴不可信内容。
          </p>
        )}

        <div className={styles.panes}>
          <div className={styles.pane}>
            <div className={styles.paneHead}>
              <span>Markdown</span>
              <span className={styles.paneCount}>{markdown.length} 字符</span>
            </div>
            <textarea
              className={styles.editor}
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              aria-label="Markdown 源文本"
            />
          </div>

          <div className={styles.pane}>
            <div className={styles.paneHead}>
              <span>预览</span>
              <span className={styles.paneCount}>HTML {html.length} 字符</span>
            </div>
            <style>{themeCss(theme)}</style>
            <div className={`${styles.previewScroll} ${theme === 'neon' ? styles.previewNeon : ''}`}>
              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
        </div>

        {error && <p className={shared.error}>{error}</p>}

        <div className={styles.exports}>
          <div className={shared.buttonGroup}>
            <span className={shared.groupLabel}>复制</span>
            <button className={shared.button} onClick={() => copyText(html).then(() => done('HTML 片段已复制'))}>
              HTML 片段
            </button>
            <button
              className={shared.button}
              onClick={() => copyRichHtml(inline, markdown).then(() => done('富文本已复制，可直接粘贴到公众号'))}
            >
              富文本
            </button>
          </div>

          <div className={shared.buttonGroup}>
            <span className={shared.groupLabel}>下载</span>
            <button
              className={shared.button}
              onClick={() => downloadTextFile(full, 'document.html', 'text/html')}
            >
              自包含 HTML
            </button>
            <button
              className={shared.button}
              onClick={() => downloadTextFile(html, 'document-fragment.html', 'text/html')}
            >
              片段
            </button>
            <button
              className={shared.button}
              onClick={() => downloadTextFile(inline, 'document-inline.html', 'text/html')}
            >
              内联样式
            </button>
            <button
              className={shared.button}
              onClick={() => downloadTextFile(markdown, 'document.md', 'text/markdown')}
            >
              Markdown
            </button>
          </div>

          {notice && <span className={styles.notice}>{notice}</span>}
        </div>
      </section>
    </ToolShell>
  );
}
