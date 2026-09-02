"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";

import { getPublicSettings } from "../lib/public-settings-client";

interface FooterSocialLink {
  platform?: string;
  name?: string;
  url?: string;
}

const DEFAULT_FOOTER = `© ${new Date().getFullYear()} 五月的火. All rights reserved.`;

const Footer: React.FC = () => {
  const [footerText, setFooterText] = useState(DEFAULT_FOOTER);
  const [socialLinks, setSocialLinks] = useState<FooterSocialLink[]>([]);

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        if (settings.footerText) setFooterText(settings.footerText);
        if (Array.isArray(settings.socialLinks))
          setSocialLinks(settings.socialLinks);
      })
      .catch(() => {
        setFooterText(DEFAULT_FOOTER);
      });
  }, []);

  const visibleSocialLinks = socialLinks.filter(
    (link) =>
      typeof link.url === "string" &&
      link.url.trim() !== "" &&
      link.url !== "#",
  );

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-text">{footerText}</div>
        <div className="footer-links">
          <Link href="/feed.xml" className="footer-link">
            RSS
          </Link>
          {visibleSocialLinks.slice(0, 3).map((link, index) => (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.name || link.platform || "source"}
            </a>
          ))}
          {visibleSocialLinks.length === 0 && (
            <Link href="/about" className="footer-link">
              about / source
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
