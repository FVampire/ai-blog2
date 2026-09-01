'use client';

import type { ReactNode } from 'react';

import styles from './preview.module.css';
import { NAV, SITE, type ViewId } from './mock';

export default function SiteFrame({
  children,
  active,
  onNavigate,
}: {
  children: ReactNode;
  active: ViewId;
  onNavigate: (view: ViewId) => void;
}) {
  return (
    <div className={styles.site}>
      <header className={styles.masthead}>
        <button type="button" className={styles.logo} onClick={() => onNavigate('home')}>
          <strong>{SITE.name}</strong>
          <span>{SITE.tagline}</span>
        </button>
        <nav className={styles.siteNav} aria-label="站点">
          {NAV.map((item) => {
            const on =
              item.view === active || (item.view === 'posts' && active === 'article');
            return (
              <button
                key={item.label}
                type="button"
                className={on ? styles.navOn : undefined}
                onClick={() => onNavigate(item.view)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>
      {children}
      <footer className={styles.siteFooter}>
        <span>
          {SITE.name} · {SITE.year}
        </span>
        <span>RSS · 文章按日期发布</span>
      </footer>
    </div>
  );
}
