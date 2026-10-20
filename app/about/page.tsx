import React from 'react';

import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { ABOUT_PROFILE_BIO } from '../../lib/about-profile';
import { SettingsRepository } from '../../lib/repositories/SettingsRepository';
import { getSkills, SKILL_CATEGORY_LABELS, type SkillItem } from '../../lib/skills';
import styles from './about.module.css';

export const dynamic = 'force-dynamic';

interface SocialLink {
  platform: string;
  name: string;
  url: string;
}

interface AboutSettings {
  authorName: string;
  authorBioShort: string;
  authorBio: string;
  authorBio2: string;
  authorBio3: string;
  authorBio4: string;
  socialLinks: SocialLink[];
}

const PAGE_TITLE = '关于我';
const PAGE_DESCRIPTION = '一名横跨图形引擎、医疗 AI、智能工作流与服装科技的全栈工程师。';
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

const CHAPTER_META = [
  { key: 'authorBio' as const, title: '我是谁' },
  { key: 'authorBio2' as const, title: '做过的事' },
  { key: 'authorBio3' as const, title: '现在在做什么' },
  { key: 'authorBio4' as const, title: '自己做的作品' },
];

const FEATURED_WORKS = [
  { href: '/projects/moling', title: '墨韵 Moyun' },
  { href: '/projects/forgetting-tide', title: '遗忘潮汐' },
];

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

function groupSkills(skills: SkillItem[]) {
  const groups: Array<{ category: string; label: string; names: string[] }> = [];
  const index = new Map<string, string[]>();

  for (const skill of skills) {
    let names = index.get(skill.category);
    if (!names) {
      names = [];
      index.set(skill.category, names);
      groups.push({
        category: skill.category,
        label: SKILL_CATEGORY_LABELS[skill.category] || skill.category,
        names,
      });
    }
    names.push(skill.name);
  }

  return groups;
}

export default async function AboutPage() {
  let settings: AboutSettings = {
    authorName: SITE_NAME,
    authorBioShort: PAGE_DESCRIPTION,
    ...ABOUT_PROFILE_BIO,
    socialLinks: [],
  };
  let avatarUrl = '';
  let skills: SkillItem[] = [];

  try {
    settings = await SettingsRepository.getAboutSettings();
    const avatar = await SettingsRepository.getSettingValue('author_avatar', '');
    if (typeof avatar === 'string') avatarUrl = avatar.trim();
    skills = await getSkills();
  } catch (error) {
    console.error('Error fetching about settings:', error);
  }

  const chapters = CHAPTER_META
    .map((meta) => ({ ...meta, body: settings[meta.key] }))
    .filter((chapter) => Boolean(chapter.body));
  const skillGroups = groupSkills(skills);
  const initial = Array.from(settings.authorName)[0] || '火';

  return (
    <div>
      <Header />

      <main className={styles.page}>
          <h1 className={styles.pageTitle}>{PAGE_TITLE}</h1>

          <header className={styles.intro}>
            <div className={styles.portrait}>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={settings.authorName}
                  width={160}
                  height={160}
                  unoptimized
                />
              ) : (
                <span aria-hidden="true">{initial}</span>
              )}
            </div>
            <div className={styles.introCopy}>
              <h2 className={styles.name}>{settings.authorName}</h2>
              <p className={styles.lead}>{settings.authorBioShort || PAGE_DESCRIPTION}</p>
              {settings.socialLinks.length > 0 && (
                <p className={styles.socials}>
                  {settings.socialLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.name}
                    </a>
                  ))}
                </p>
              )}
            </div>
          </header>

          <div className={styles.body}>
            <div className={styles.essay}>
              {chapters.map((chapter) => (
                <section key={chapter.key} className={styles.section}>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.body}</p>
                  {chapter.key === 'authorBio4' && (
                    <p className={styles.workMentions}>
                      {FEATURED_WORKS.map((work) => (
                        <Link key={work.href} href={work.href}>
                          {work.title}
                        </Link>
                      ))}
                    </p>
                  )}
                </section>
              ))}
            </div>

            {skillGroups.length > 0 && (
              <aside className={styles.aside} aria-label="技能">
                <h3>技能</h3>
                {skillGroups.map((group) => (
                  <div key={group.category} className={styles.skillGroup}>
                    <h4>{group.label}</h4>
                    <p>{group.names.join(' · ')}</p>
                  </div>
                ))}
              </aside>
            )}
          </div>
        </main>

      <Footer />
    </div>
  );
}
