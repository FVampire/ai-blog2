import type { CSSProperties, ReactNode } from 'react';
import { type ToolExecutionMode, type ToolMeta } from '@/lib/tools/registry';
import DataSourceNote from './DataSourceNote';
import styles from './tools-shared.module.css';

const EXECUTION_CLASS: Record<ToolExecutionMode, string> = {
  local: styles.metaLocal,
  server: styles.metaServer,
  proxy: styles.metaProxy,
  hybrid: styles.metaProxy,
};

export default function ToolShell({
  meta,
  children,
  requestUrl,
  fetchedAt,
}: {
  meta: ToolMeta;
  children: ReactNode;
  requestUrl?: string;
  fetchedAt?: string;
}) {
  return (
    <main className={styles.shell} style={{ '--tool-accent': meta.accent } as CSSProperties}>
      <header className={styles.hero}>
        <span className={styles.icon} aria-hidden="true">{meta.icon}</span>
        <div className={styles.heroText}>
          <h1>{meta.name}<small>{meta.enName}</small></h1>
          <p className={styles.description}>{meta.description}</p>
        </div>
        <div className={styles.heroMeta}>
          <span
            className={`${styles.metaChip} ${EXECUTION_CLASS[meta.execution.mode]}`}
            title={meta.execution.note}
          >
            {meta.execution.label}
          </span>
          {meta.dataSource && (
            <span className={styles.metaChip} title={meta.dataSource.integration}>
              数据来自 {meta.dataSource.provider}
            </span>
          )}
          {meta.status === 'beta' && <span className={styles.metaChip}>Beta</span>}
        </div>
      </header>

      {children}

      {meta.dataSource && <DataSourceNote source={meta.dataSource} requestUrl={requestUrl} fetchedAt={fetchedAt} />}
    </main>
  );
}
