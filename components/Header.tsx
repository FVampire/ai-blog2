'use client';

import React from 'react';

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

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="logo">BLOG</div>
      <nav className="navigation">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/articles">Articles</NavLink>
        <NavLink href="/tags">Tags</NavLink>
      </nav>
    </header>
  );
};

export default Header;
