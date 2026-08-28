'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '@/lib/tools/registry';
import { toolMatchesQuery, useToolsNav } from './ToolsNavContext';
import styles from './tools-workspace.module.css';

const STORAGE_KEY = 'tools:sidebar-collapsed';

/** 工作区越宽越好用的工具，首次进入时默认折叠目录，之后完全交给用户偏好 */
const WIDE_TOOLS = new Set(['js-playground', 'markdown-to-html']);

export default function ToolsSidebar() {
  const pathname = usePathname();
  const currentSlug = pathname.startsWith('/tools/') ? pathname.slice('/tools/'.length) : '';
  const { tools, query, setQuery, category, setCategory } = useToolsNav();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 服务端拿不到 localStorage，先按展开渲染，挂载后再校正，避免水合不一致
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === '1');
    else if (WIDE_TOOLS.has(currentSlug)) setCollapsed(true);
    // 仅在挂载时决定初始态
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const available = useMemo(() => tools.filter((item) => item.status !== 'planned'), [tools]);

  const countFor = (key: typeof category) => tools.filter((tool) => (
    (key === 'all' || tool.category === key) && toolMatchesQuery(tool, query)
  )).length;

  const hasMatches = available.some((tool) =>
    (category === 'all' || tool.category === category) && toolMatchesQuery(tool, query),
  );

  return (
    <>
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setDrawerOpen(true)}
        aria-label="打开工具目录"
      >
        ☰ 工具目录
      </button>

      {drawerOpen && (
        <div className={styles.scrim} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={[
          styles.sidebar,
          collapsed ? styles.sidebarCollapsed : '',
          drawerOpen ? styles.sidebarOpen : '',
        ].filter(Boolean).join(' ')}
        aria-label="工具目录"
      >
        <div className={styles.sidebarHead}>
          <Link href="/tools" className={styles.sidebarTitle}>工具箱</Link>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={toggleCollapsed}
            aria-label={collapsed ? '展开工具目录' : '折叠工具目录'}
            title={collapsed ? '展开工具目录' : '折叠工具目录'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.filterWrap}>
            <div className={styles.searchWrap}>
              <input
                className={styles.filter}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索工具…"
                aria-label="搜索工具"
              />
              {query && (
                <button
                  type="button"
                  className={styles.filterClear}
                  onClick={() => setQuery('')}
                  aria-label="清空搜索"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <nav className={styles.nav}>
            <button
              type="button"
              className={`${styles.cat} ${category === 'all' ? styles.catActive : ''}`}
              onClick={() => setCategory('all')}
            >
              全部
              <span className={styles.catCount}>{countFor('all')}</span>
            </button>

            {CATEGORIES.map((item) => {
              const items = available.filter((tool) => tool.category === item.key && toolMatchesQuery(tool, query));
              if (!items.length && category !== item.key) return null;
              const expanded = category === 'all' || category === item.key;
              return (
                <div className={styles.group} key={item.key}>
                  <button
                    type="button"
                    className={`${styles.cat} ${category === item.key ? styles.catActive : ''}`}
                    onClick={() => setCategory(category === item.key ? 'all' : item.key)}
                  >
                    {item.name}
                    <span className={styles.catCount}>{countFor(item.key)}</span>
                  </button>
                  {expanded && items.length > 0 && (
                    <ul>
                      {items.map((tool) => {
                        const active = tool.slug === currentSlug;
                        return (
                          <li key={tool.slug}>
                            <Link
                              href={`/tools/${tool.slug}`}
                              className={`${styles.link} ${active ? styles.linkActive : ''}`}
                              aria-current={active ? 'page' : undefined}
                            >
                              <span className={styles.dot} style={{ background: tool.accent }} aria-hidden="true" />
                              <span className={styles.linkName}>{tool.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}

            {!hasMatches && (
              <p className={styles.navEmpty}>没有匹配的工具，试试更短的关键词。</p>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}
