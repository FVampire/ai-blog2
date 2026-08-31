'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BASE_PATH, universeNav } from './data';
import styles from './forgetting-tide.module.css';

export type TideAnchor = readonly [id: string, label: string];

type TideContextValue = {
  setAnchors: (items: readonly TideAnchor[]) => void;
};

const TideContext = createContext<TideContextValue>({ setAnchors: () => undefined });

export function useTideAnchors(items: readonly TideAnchor[]) {
  const { setAnchors } = useContext(TideContext);

  useEffect(() => {
    setAnchors(items);
    return () => setAnchors([]);
  }, [items, setAnchors]);
}

export function TideAnchors({ items }: { items: readonly TideAnchor[] }) {
  useTideAnchors(items);
  return null;
}

function isNavActive(pathname: string, href: string) {
  if (href === BASE_PATH) return pathname === BASE_PATH || pathname === `${BASE_PATH}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TideNav({
  pathname,
  open,
  onClose,
}: {
  pathname: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside className={`${styles.tideNav} ${open ? styles.tideNavOpen : ''}`} aria-label="遗忘潮汐宇宙导航">
      <Link href={BASE_PATH} className={styles.tideBrand} onClick={onClose}>
        <small>THE FORGETTING TIDE</small>
        <strong>遗忘潮汐</strong>
        <span>维拉汀宇宙</span>
      </Link>
      <nav className={styles.tideNavList}>
        {universeNav.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={active ? styles.tideNavActive : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={onClose}
            >
              <b>{item.label}</b>
              <small>{item.en}</small>
            </Link>
          );
        })}
      </nav>
      <Link href="/projects" className={styles.tideNavBack} onClick={onClose}>
        ← 项目归档
      </Link>
    </aside>
  );
}

function AnchorNav({ items }: { items: readonly TideAnchor[] }) {
  const [active, setActive] = useState(items[0]?.[0] ?? '');

  useEffect(() => {
    const targets = items
      .map(([id]) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (targets.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className={styles.rivetNav} aria-label="本页锚点">
      {items.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className={active === id ? styles.rivetActive : undefined}
          aria-current={active === id ? 'true' : undefined}
        >
          <i aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

export default function TideFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? BASE_PATH;
  const [anchors, setAnchorsState] = useState<readonly TideAnchor[]>([]);
  const [open, setOpen] = useState(false);

  const setAnchors = useCallback((items: readonly TideAnchor[]) => {
    setAnchorsState(items);
  }, []);

  const value = useMemo(() => ({ setAnchors }), [setAnchors]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <TideContext.Provider value={value}>
      <div className={styles.universe}>
        <button
          type="button"
          className={styles.navFab}
          aria-expanded={open}
          aria-controls="tide-universe-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? '关闭' : '宇宙'}
        </button>
        <div id="tide-universe-nav">
          <TideNav pathname={pathname} open={open} onClose={() => setOpen(false)} />
        </div>
        {open ? (
          <button type="button" className={styles.navScrim} aria-label="关闭目录" onClick={() => setOpen(false)} />
        ) : null}
        <div className={styles.universeMain}>{children}</div>
        <AnchorNav items={anchors} />
      </div>
    </TideContext.Provider>
  );
}
