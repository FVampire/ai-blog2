'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import { DEFAULT_PROJECT_NAV_LABEL, normalizeProjectNavLabel } from '../lib/project-nav-label';
import { getPublicSettings } from '../lib/public-settings-client';

interface FooterSocialLink {
  platform?: string;
  name?: string;
  url?: string;
}

const DEFAULT_FOOTER = `© ${new Date().getFullYear()} 五月的火. All rights reserved.`;

const Footer: React.FC = () => {
  const [footerText, setFooterText] = useState(DEFAULT_FOOTER);
  const [socialLinks, setSocialLinks] = useState<FooterSocialLink[]>([]);
  const [projectsEnabled, setProjectsEnabled] = useState(true);
  const [projectsNavLabel, setProjectsNavLabel] = useState(DEFAULT_PROJECT_NAV_LABEL);

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        if (settings.footerText) setFooterText(settings.footerText);
        if (Array.isArray(settings.socialLinks)) setSocialLinks(settings.socialLinks);
        if (settings.projectsEnabled !== undefined) setProjectsEnabled(settings.projectsEnabled);
        if (settings.projectsNavLabel) {
          setProjectsNavLabel(normalizeProjectNavLabel(settings.projectsNavLabel));
        }
      })
      .catch(() => {
        setFooterText(DEFAULT_FOOTER);
      });
  }, []);

  const navItems: Array<{ href: string; label: string }> = [
    { href: '/', label: '首页' },
    { href: '/articles', label: '文章' },
    ...(projectsEnabled ? [{ href: '/projects', label: projectsNavLabel }] : []),
    { href: '/tools', label: '工具' },
    { href: '/tags', label: '标签' },
    { href: '/about', label: '关于' },
  ];

  const visibleSocialLinks = socialLinks.filter(
    (link) => typeof link.url === 'string' && link.url.trim() !== '' && link.url !== '#'
  );

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h2 className="footer-col-title">站点导航</h2>
          <ul className="footer-list">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="footer-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h2 className="footer-col-title">社交</h2>
          {visibleSocialLinks.length > 0 ? (
            <ul className="footer-list">
              {visibleSocialLinks.map((link, index) => (
                <li key={`${link.url}-${index}`}>
                  <a
                    href={link.url}
                    className="footer-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.name || link.platform || link.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer-empty">暂无社交链接</p>
          )}
        </div>

        <div className="footer-col">
          <h2 className="footer-col-title">订阅</h2>
          <a href="/feed.xml" className="footer-link footer-rss">
            RSS 订阅
          </a>
          <div className="footer-text">{footerText}</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
