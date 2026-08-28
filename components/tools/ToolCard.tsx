import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { ToolMeta } from '@/lib/tools/registry';
import styles from '@/app/tools/tools.module.css';

export default function ToolCard({ tool }: { tool: ToolMeta }) {
  const planned = tool.status === 'planned';

  // 本地处理是绝大多数工具的默认情况，只有走服务端或依赖第三方时才值得占用一行说明
  const footnote = tool.dataSource
    ? `数据来自 ${tool.dataSource.provider}`
    : tool.execution.mode === 'local' ? '' : tool.execution.label;

  const style = {
    '--accent': tool.accent,
    '--icon-len': tool.icon.length,
  } as CSSProperties;

  const content = (
    <>
      <div className={styles.cardTop}>
        <span className={styles.cardIcon} aria-hidden="true">{tool.icon}</span>
        {planned && <span className={`${styles.badge} ${styles.badgePlanned}`}>规划中</span>}
        {tool.status === 'beta' && <span className={`${styles.badge} ${styles.badgeBeta}`}>BETA</span>}
      </div>

      <h3>{tool.name}</h3>
      <p className={styles.enName}>{tool.enName}</p>

      {planned ? (
        <p className={styles.plannedNote}>{tool.plannedNote}</p>
      ) : (
        <>
          <p className={styles.tagline}>{tool.tagline}</p>
          <div className={styles.tags}>
            {tool.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          {footnote && <small className={styles.provider}>{footnote}</small>}
        </>
      )}
    </>
  );

  if (planned) {
    return <article className={`${styles.card} ${styles.planned}`} style={style}>{content}</article>;
  }

  return <Link className={styles.card} style={style} href={`/tools/${tool.slug}`}>{content}</Link>;
}
