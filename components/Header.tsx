"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useTheme } from "../contexts/ThemeContext";
import {
  DEFAULT_PROJECT_NAV_LABEL,
  normalizeProjectNavLabel,
} from "../lib/project-nav-label";
import { getPublicSettings } from "../lib/public-settings-client";

interface NavLinkProps {
  href: string;
  className?: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}

function useIsActive(href: string) {
  const pathname = usePathname();
  return pathname === href || (href !== "/" && !!pathname?.startsWith(href));
}

const NavLink: React.FC<NavLinkProps> = ({
  href,
  className = "nav-link",
  onNavigate,
  children,
}) => {
  const isActive = useIsActive(href);

  return (
    <Link
      href={href}
      className={`${className} ${isActive ? "active" : ""}`}
      aria-current={isActive ? "page" : undefined}
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
  const [siteName, setSiteName] = useState("五月的火");
  const [fetchedNavLabel, setFetchedNavLabel] = useState(
    DEFAULT_PROJECT_NAV_LABEL,
  );
  const [fetchedEnabled, setFetchedEnabled] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const projectsNavLabel = normalizeProjectNavLabel(
    propNavLabel ?? fetchedNavLabel,
  );
  const projectsEnabled = propEnabled ?? fetchedEnabled;
  const section = pathname?.startsWith("/projects")
    ? "projects"
    : pathname?.startsWith("/tools")
      ? "tools"
      : "blog";

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        if (settings.siteName) setSiteName(settings.siteName);
        if (settings.projectsNavLabel) {
          setFetchedNavLabel(
            normalizeProjectNavLabel(settings.projectsNavLabel),
          );
        }
        if (settings.projectsEnabled !== undefined)
          setFetchedEnabled(settings.projectsEnabled);
      })
      .catch((err) => {
        console.error("Failed to fetch site settings:", err);
      });
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
    document.documentElement.dataset.section = section;
  }, [pathname, section]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const navItems: Array<{ href: string; label: string }> = [
    { href: "/", label: "首页" },
    { href: "/articles", label: "文章" },
    { href: "/series", label: "系列" },
    ...(projectsEnabled
      ? [{ href: "/projects", label: projectsNavLabel }]
      : []),
    { href: "/tools", label: "工具" },
    { href: "/about", label: "关于" },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header" data-section={section}>
      <Link href="/" className="logo" aria-label="返回首页">
        <strong>{siteName}</strong>
        <span>notes/</span>
      </Link>

      <nav className="navigation" aria-label="主导航">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-actions">
        <button
          type="button"
          className="header-action header-search"
          onClick={() => router.push("/search")}
          aria-label="搜索（Ctrl 或 Command 加 K）"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <span>搜索文章、项目、工具</span>
          <kbd>Ctrl</kbd>
          <kbd>K</kbd>
        </button>
        <button
          type="button"
          className="header-action theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "切换到浅色模式" : "切换到暗色模式"}
        >
          {theme === "dark" ? "☀" : "◔"}
        </button>
      </div>

      <button
        type="button"
        className={`nav-toggle ${menuOpen ? "is-open" : ""}`}
        aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
      </button>

      {menuOpen && (
        <div className="nav-overlay" onClick={closeMenu} aria-hidden="true" />
      )}

      <nav
        id="mobile-navigation"
        className={`nav-drawer ${menuOpen ? "is-open" : ""}`}
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
