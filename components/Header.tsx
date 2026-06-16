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
  const isActive = pathname === href;

  return (
    <Link href={href} className={`nav-link ${isActive ? 'active' : ''}`}>
      {children}
    </Link>
  );
};

interface SiteSettings {
  siteName: string;
}

const Header: React.FC = () => {
  const [siteName, setSiteName] = useState('BLOG');

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.siteName) {
          setSiteName(data.data.siteName);
        }
      })
      .catch(err => {
        console.error('Failed to fetch site settings:', err);
      });
  }, []);

  return (
    <header className="header">
      <div className="logo">{siteName}</div>
      <nav className="navigation">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/articles">Articles</NavLink>
        <NavLink href="/tags">Tags</NavLink>
      </nav>
    </header>
  );
};

export default Header;
