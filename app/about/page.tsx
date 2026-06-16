import React from 'react';

import type { Metadata } from 'next';

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

export const metadata: Metadata = {
  title: 'About - 五月的火',
  description: 'About the author',
  icons: { icon: '/favicon.ico' },
};

export default async function AboutPage() {
  let settings: AboutSettings = {
    authorName: 'John Doe',
    authorBio: "I'm a full-stack developer with over 10 years of experience building web applications.",
    authorBio2: 'I specialize in modern JavaScript frameworks like React and Node.js.',
    authorBio3: 'I believe in continuous learning and sharing knowledge with the community.',
    socialLinks: [],
  };

  try {
    settings = await SettingsRepository.getAboutSettings();
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
              <h1 className="section-title">About Me</h1>
              <div className="card">
                <div className="avatar mx-auto mb-5"></div>
                <h2 className="author-name">{settings.authorName}</h2>
                <p className="author-bio">{settings.authorBio}</p>
                <p className="author-bio">{settings.authorBio2}</p>
                <p className="author-bio">{settings.authorBio3}</p>
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
