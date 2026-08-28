'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

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
  const [projectsNavLabel, setProjectsNavLabel] = useState('项目');

  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.data) return;
        if (data.data.footerText) setFooterText(data.data.footerText);
        if (Array.isArray(data.data.socialLinks)) setSocialLinks(data.data.socialLinks);
        if (data.data.projectsEnabled !== undefined) setProjectsEnabled(data.data.projectsEnabled);
        if (data.data.projectsNavLabel) setProjectsNavLabel(data.data.projectsNavLabel);
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
