'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  className?: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}

function useIsActive(href: string) {
  const pathname = usePathname();
  return pathname === href || (href !== '/' && !!pathname?.startsWith(href));
}

const NavLink: React.FC<NavLinkProps> = ({ href, className = 'nav-link', onNavigate, children }) => {
  const isActive = useIsActive(href);

  return (
    <Link
      href={href}
      className={`${className} ${isActive ? 'active' : ''}`}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
};

interface HeaderProps {
  projectsNavLabel?: string;
  projectsEnabled?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  projectsNavLabel: propNavLabel,
  projectsEnabled: propEnabled,
}) => {
  const [siteName, setSiteName] = useState('BLOG');
  const [fetchedNavLabel, setFetchedNavLabel] = useState('项目');
  const [fetchedEnabled, setFetchedEnabled] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const projectsNavLabel = propNavLabel ?? fetchedNavLabel;
  const projectsEnabled = propEnabled ?? fetchedEnabled;

  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.siteName) setSiteName(data.data.siteName);
          if (data.data.projectsNavLabel) setFetchedNavLabel(data.data.projectsNavLabel);
          if (data.data.projectsEnabled !== undefined) setFetchedEnabled(data.data.projectsEnabled);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch site settings:', err);
      });
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const navItems: Array<{ href: string; label: string }> = [
    { href: '/', label: '首页' },
    { href: '/articles', label: '文章' },
    ...(projectsEnabled ? [{ href: '/projects', label: projectsNavLabel }] : []),
    { href: '/tools', label: '工具' },
    { href: '/tags', label: '标签' },
    { href: '/about', label: '关于' },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <Link href="/" className="logo" aria-label="返回首页">
        {siteName}
      </Link>

      <nav className="navigation" aria-label="主导航">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className={`nav-toggle ${menuOpen ? 'is-open' : ''}`}
        aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
      </button>

      {menuOpen && <div className="nav-overlay" onClick={closeMenu} aria-hidden="true" />}

      <nav
        id="mobile-navigation"
        className={`nav-drawer ${menuOpen ? 'is-open' : ''}`}
        aria-label="移动端导航"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            className="nav-drawer-link"
            onNavigate={closeMenu}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default Header;
