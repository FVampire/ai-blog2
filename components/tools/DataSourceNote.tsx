import type { DataSourceMeta } from '@/lib/tools/registry';
import CopyButton from './CopyButton';
import styles from './tools-shared.module.css';

export default function DataSourceNote({
  source,
  requestUrl,
  fetchedAt,
}: {
  source: DataSourceMeta;
  requestUrl?: string;
  fetchedAt?: string;
}) {
  return (
    <details className={styles.source}>
      <summary className={styles.sourceHeader}>数据来源与接入说明</summary>
      <dl className={styles.sourceGrid}>
        <dt>服务商</dt>
        <dd><a href={source.providerUrl} target="_blank" rel="noreferrer">{source.provider} ↗</a></dd>

        <dt>官方文档</dt>
        <dd><a href={source.docsUrl} target="_blank" rel="noreferrer">{source.docsUrl} ↗</a></dd>

        <dt>接入方式</dt>
        <dd>{source.integration}</dd>

        <dt>鉴权</dt>
        <dd>{source.auth}</dd>

        <dt>端点</dt>
        <dd>{source.endpoints.map((endpoint) => <div key={endpoint}><code>{endpoint}</code></div>)}</dd>

        {source.rateLimit && <><dt>调用配额</dt><dd>{source.rateLimit}</dd></>}

        <dt>许可</dt>
        <dd>{source.license}</dd>

        {source.attribution && (
          <>
            <dt>署名</dt>
            <dd><a href={source.providerUrl} target="_blank" rel="noreferrer">{source.attribution} ↗</a></dd>
          </>
        )}

        {requestUrl && (
          <>
            <dt>本次请求</dt>
            <dd>
              <div className={styles.requestRow}>
                <code>{requestUrl}</code>
                <CopyButton value={requestUrl} label="复制 URL" small />
              </div>
            </dd>
          </>
        )}

        {fetchedAt && <><dt>获取时间</dt><dd>{new Date(fetchedAt).toLocaleString('zh-CN')}</dd></>}
      </dl>
    </details>
  );
}
