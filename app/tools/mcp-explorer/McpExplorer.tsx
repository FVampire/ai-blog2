'use client';

import { useEffect, useMemo, useState } from 'react';
import { getTool } from '@/lib/tools/registry';
import CopyButton from '@/components/tools/CopyButton';
import ToolShell from '@/components/tools/ToolShell';
import shared from '@/components/tools/tools-shared.module.css';
import styles from './mcp-explorer.module.css';

type Server = {
  name: string;
  title?: string;
  description?: string;
  version: string;
  repository?: { url?: string };
  websiteUrl?: string;
  remotes?: { type: string; url: string }[];
  packages?: { registryType?: string; identifier?: string; version?: string }[];
};

type Entry = { server: Server; _meta?: Record<string, { status?: string; updatedAt?: string; isLatest?: boolean }> };

const CLIENTS = [
  { key: 'cursor', label: 'Cursor', file: '.cursor/mcp.json' },
  { key: 'claude', label: 'Claude Desktop', file: 'claude_desktop_config.json' },
] as const;

type ClientKey = typeof CLIENTS[number]['key'];

function configFor(server: Server, client: ClientKey) {
  const remote = server.remotes?.[0];
  const pkg = server.packages?.[0];
  const key = server.title || server.name.split('/').pop() || server.name;
  let config: Record<string, unknown>;

  if (remote) {
    // Claude Desktop 只接受 stdio 启动命令，远程 server 需要经 mcp-remote 代理
    config = client === 'claude'
      ? { command: 'npx', args: ['-y', 'mcp-remote', remote.url] }
      : { url: remote.url, type: remote.type === 'sse' ? 'sse' : 'http' };
  } else if (pkg?.registryType === 'npm') {
    config = { command: 'npx', args: ['-y', `${pkg.identifier}${pkg.version ? `@${pkg.version}` : ''}`] };
  } else if (pkg?.registryType === 'pypi') {
    config = { command: 'uvx', args: [pkg.identifier] };
  } else {
    config = { comment: '该条目未提供可自动生成的 remote 或 package 配置，请查看项目文档。' };
  }

  return JSON.stringify({ mcpServers: { [key]: config } }, null, 2);
}

const transportsOf = (server: Server) => [
  ...(server.remotes ?? []).map((item) => item.type),
  ...(server.packages ?? []).map((item) => item.registryType),
].filter(Boolean) as string[];

export default function McpExplorer() {
  const meta = getTool('mcp-explorer')!;
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [cursor, setCursor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState<{ requestUrl?: string; fetchedAt?: string }>({});
  const [selected, setSelected] = useState<Entry | null>(null);
  const [client, setClient] = useState<ClientKey>('cursor');
  const [versions, setVersions] = useState<Entry[]>([]);

  const load = async (append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: query, limit: '20' });
      if (append && cursor) params.set('cursor', cursor);
      const response = await fetch(`/api/tools/mcp/registry?${params}`);
      const body = await response.json();
      if (!body.success) throw new Error(body.error);
      setEntries((old) => append ? [...old, ...(body.data.servers ?? [])] : body.data.servers ?? []);
      setCursor(body.data.metadata?.nextCursor ?? '');
      setSource(body.meta);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '查询失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => load(false), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const open = async (entry: Entry) => {
    setSelected(entry);
    setVersions([]);
    try {
      const response = await fetch(`/api/tools/mcp/registry?name=${encodeURIComponent(entry.server.name)}`);
      const body = await response.json();
      if (body.success) setVersions(body.data.servers ?? []);
    } catch { /* 没有历史版本也不影响配置生成 */ }
  };

  const config = useMemo(() => selected ? configFor(selected.server, client) : '', [client, selected]);
  const activeClient = CLIENTS.find((item) => item.key === client)!;

  return (
    <ToolShell meta={meta} requestUrl={source.requestUrl} fetchedAt={source.fetchedAt}>
      <section className={shared.workspace}>
        <div className={styles.searchRow}>
          <input
            className={`${shared.input} ${styles.searchInput}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 server 名称，例如 filesystem、github…"
            aria-label="搜索 MCP server"
          />
          <button className={`${shared.button} ${shared.buttonPrimary}`} onClick={() => load(false)}>搜索</button>
        </div>

        {error && <p className={shared.error}>{error}</p>}
        {loading && !entries.length && <p className={shared.loading}>正在查询官方注册表…</p>}

        {!loading && !error && !entries.length && (
          <div className={shared.emptyState}>
            <strong>没有匹配的 server</strong>
            换一个关键词试试，例如 filesystem、github、postgres。
          </div>
        )}

        {entries.length > 0 && (
          <p className={styles.resultMeta}>
            {query ? `“${query}” 的匹配结果` : '注册表最新条目'} · 已显示 {entries.length} 个
          </p>
        )}

        <div className={shared.itemGrid}>
          {entries.map((entry) => {
            const { server } = entry;
            const official = entry._meta ? Object.values(entry._meta)[0] : undefined;
            const transports = transportsOf(server);
            return (
              <article className={shared.item} key={`${server.name}@${server.version}`}>
                <div className={shared.itemHead}>
                  {official?.status === 'active'
                    ? <span className={`${shared.chip} ${shared.chipOk}`}>active</span>
                    : <span className={shared.chip}>{official?.status ?? 'unknown'}</span>}
                  <span className={shared.chip}>v{server.version}</span>
                  {transports.map((transport) => (
                    <span className={`${shared.chip} ${shared.chipMuted}`} key={transport}>{transport}</span>
                  ))}
                </div>

                <h3 className={styles.name}>{server.title || server.name.split('/').pop()}</h3>
                <code className={styles.fullName} title={server.name}>{server.name}</code>
                <p className={styles.desc}>{server.description || '该条目未提供描述。'}</p>

                <div className={shared.itemFoot}>
                  <button
                    className={`${shared.button} ${shared.buttonSmall}`}
                    onClick={() => open(entry)}
                  >
                    生成配置
                  </button>
                  {server.repository?.url && (
                    <a
                      className={`${shared.button} ${shared.buttonSmall}`}
                      href={server.repository.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      仓库 ↗
                    </a>
                  )}
                  {server.websiteUrl && (
                    <a
                      className={`${shared.button} ${shared.buttonSmall}`}
                      href={server.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      网站 ↗
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {cursor && (
          <div className={styles.loadMore}>
            <button className={shared.button} disabled={loading} onClick={() => load(true)}>
              {loading ? '加载中…' : '加载更多'}
            </button>
          </div>
        )}

        {selected && (
          <div className={styles.detail}>
            <div className={styles.detailHead}>
              <h2 className={styles.detailTitle}>{selected.server.title || selected.server.name}</h2>
              <div className={shared.segmented} role="group" aria-label="目标客户端">
                {CLIENTS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`${shared.segment} ${client === item.key ? shared.segmentActive : ''}`}
                    onClick={() => setClient(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <CopyButton value={config} label="复制配置" primary />
              <button className={shared.button} onClick={() => setSelected(null)}>关闭</button>
            </div>

            <div className={styles.detailBody}>
              <p className={styles.hint}>
                把下面的内容合并到 <code>{activeClient.file}</code> 的 <code>mcpServers</code> 中。
                {selected.server.remotes?.length && client === 'claude'
                  ? ' Claude Desktop 只支持 stdio，因此远程 server 通过 mcp-remote 代理接入。'
                  : ''}
              </p>
              <pre className={shared.codeBlock}><code>{config}</code></pre>
              {versions.length > 0 && (
                <p className={styles.versions}>
                  历史版本：
                  {versions.map((item) => (
                    <span className={shared.chip} key={item.server.version}>v{item.server.version}</span>
                  ))}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </ToolShell>
  );
}
