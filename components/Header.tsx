'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <Link href={href} className={`nav-link ${isActive ? 'active' : ''}`}>
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
  const [fetchedNavLabel, setFetchedNavLabel] = useState('Projects');
  const [fetchedEnabled, setFetchedEnabled] = useState(true);

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

  return (
    <header className="header">
      <div className="logo">{siteName}</div>
      <nav className="navigation">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/articles">Articles</NavLink>
        {projectsEnabled && (
          <NavLink href="/projects">{projectsNavLabel}</NavLink>
        )}
        <NavLink href="/tags">Tags</NavLink>
        <NavLink href="/about">About</NavLink>
      </nav>
    </header>
  );
};

export default Header;
