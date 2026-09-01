'use client';

import { useCallback, useEffect, useState } from 'react';

import SiteFrame from './SiteFrame';
import AboutScreen from './screens/AboutScreen';
import PostsScreen from './screens/ArchiveScreen';
import ArticleScreen from './screens/ArticleScreen';
import HomeScreen from './screens/HomeScreen';
import TagsScreen from './screens/TagsScreen';
import WorkScreen from './screens/WorkScreen';
import { type ViewId } from './mock';
import styles from './preview.module.css';

const TABS: { id: ViewId; label: string }[] = [
  { id: 'home', label: '首页' },
  { id: 'article', label: '文章页' },
  { id: 'posts', label: '文章列表' },
  { id: 'tags', label: '标签' },
  { id: 'projects', label: '项目' },
  { id: 'about', label: '关于' },
];

function isView(value: string | null): value is ViewId {
  return TABS.some((tab) => tab.id === value);
}

export default function PreviewApp() {
  const [view, setView] = useState<ViewId>('home');

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('view');
    if (isView(value)) setView(value);
  }, []);

  const onNavigate = useCallback((next: ViewId) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set('view', next);
    window.history.replaceState(null, '', url);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.frame} data-theme="light">
      <header className={styles.chrome}>
        <div className={styles.chromeBrand}>
          <strong>博客预览</strong>
          <span>mock · 不接真实数据</span>
        </div>
        <nav className={styles.tabs} aria-label="设计稿屏幕">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${view === tab.id ? styles.tabActive : ''}`}
              onClick={() => onNavigate(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <div className={styles.stage}>
        <SiteFrame active={view} onNavigate={onNavigate}>
          {view === 'home' && <HomeScreen onNavigate={onNavigate} />}
          {view === 'article' && <ArticleScreen onNavigate={onNavigate} />}
          {view === 'posts' && <PostsScreen onNavigate={onNavigate} />}
          {view === 'tags' && <TagsScreen onNavigate={onNavigate} />}
          {view === 'projects' && <WorkScreen />}
          {view === 'about' && <AboutScreen />}
        </SiteFrame>
      </div>
    </div>
  );
}
