import React from 'react';

import type { Metadata } from 'next';
import Image from 'next/image';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SkillsList from '../../components/SkillsList';
import { SettingsRepository } from '../../lib/repositories/SettingsRepository';

interface SocialLink {
  platform: string;
  name: string;
  url: string;
}

interface AboutSettings {
  authorName: string;
  authorBio: string;
  authorBio2: string;
  authorBio3: string;
  socialLinks: SocialLink[];
}

const PAGE_TITLE = '关于我';
const PAGE_DESCRIPTION = '关于作者、技术栈与联系方式。';
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  icons: { icon: '/favicon.ico' },
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: 'profile',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    locale: 'zh_CN',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ['/og-default.png'],
  },
};

export default async function AboutPage() {
  let settings: AboutSettings = {
    authorName: SITE_NAME,
    authorBio: '这里还没有填写自我介绍。',
    authorBio2: '',
    authorBio3: '',
    socialLinks: [],
  };
  let avatarUrl = '';

  try {
    settings = await SettingsRepository.getAboutSettings();
    const avatar = await SettingsRepository.getSettingValue('author_avatar', '');
    if (typeof avatar === 'string') avatarUrl = avatar.trim();
  } catch (error) {
    console.error('Error fetching about settings:', error);
  }

  return (
    <div>
      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <h1 className="section-title">{PAGE_TITLE}</h1>
              <div className="card">
                <div className="avatar mx-auto mb-5" style={{ overflow: 'hidden' }}>
                  {avatarUrl && (
                    <Image
                      src={avatarUrl}
                      alt={settings.authorName}
                      width={80}
                      height={80}
                      unoptimized
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <h2 className="author-name">{settings.authorName}</h2>
                {settings.authorBio && <p className="author-bio">{settings.authorBio}</p>}
                {settings.authorBio2 && <p className="author-bio">{settings.authorBio2}</p>}
                {settings.authorBio3 && <p className="author-bio">{settings.authorBio3}</p>}
                {settings.socialLinks && settings.socialLinks.length > 0 && (
                  <div className="social-links justify-center mt-5">
                    {settings.socialLinks.map((link) => (
                      <a key={link.platform} href={link.url} className="social-link" target="_blank" rel="noopener noreferrer">
                        {link.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sidebar">
            <SkillsList />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
