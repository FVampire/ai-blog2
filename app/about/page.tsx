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
const THESIS = '如何把复杂技术真正变成可使用、可复用、可规模化的系统。';

const DOMAINS = [
  { index: '01', title: '图形引擎', copy: '浏览器端 CAD 与三维交互' },
  { index: '02', title: '医疗 AI', copy: '病历结构化与诊疗辅助' },
  { index: '03', title: '智能工作流', copy: 'Agent、MCP 与流程编排' },
  { index: '04', title: '服装科技', copy: '试穿、搭配与自动打版' },
] as const;

const CHAPTER_META = [
  { key: 'authorBio' as const, index: '01', kicker: 'POSITIONING', title: '个人定位' },
  { key: 'authorBio2' as const, index: '02', kicker: 'INDUSTRY', title: '行业项目' },
  { key: 'authorBio3' as const, index: '03', kicker: 'DIRECTION', title: '工作流与当前方向' },
  { key: 'authorBio4' as const, index: '04', kicker: 'WORKS', title: '代表作品' },
];

const FEATURED_WORKS = [
  {
    href: '/projects/moling',
    kicker: 'DESKTOP AI',
    title: '墨灵 Moling',
    copy: '面向长篇小说的桌面创作工作台',
  },
  {
    href: '/projects/forgetting-tide',
    kicker: 'NARRATIVE GAME',
    title: '遗忘潮汐',
    copy: '从世界观到原创配乐的完整构筑',
  },
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
    <div className={styles.shell}>
      <Header />

      <main className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>PROFILE · ABOUT</p>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1>{settings.authorName}</h1>
              <p className={styles.lead}>{settings.authorBioShort || PAGE_DESCRIPTION}</p>
              {settings.socialLinks.length > 0 && (
                <div className={styles.socials}>
                  {settings.socialLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      className={styles.social}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.portrait}>
              <div className={styles.portraitPlate} aria-hidden="true" />
              <div className={styles.portraitFrame}>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={settings.authorName}
                    width={420}
                    height={520}
                    unoptimized
                    className={styles.portraitImg}
                  />
                ) : (
                  <span className={styles.portraitInitial}>{initial}</span>
                )}
              </div>
              <p className={styles.portraitCaption}>全栈 · AI 应用 · 产品落地</p>
            </div>
          </div>
        </header>

        <section className={styles.domainMap} aria-label="关注领域">
          {DOMAINS.map((domain) => (
            <article key={domain.index}>
              <span>{domain.index}</span>
              <b>{domain.title}</b>
              <small>{domain.copy}</small>
            </article>
          ))}
        </section>

        <section className={styles.chapters} aria-label="经历与方向">
          {chapters.map((chapter, index) => (
            <article
              key={chapter.key}
              className={index === 0 ? styles.chapterFeature : styles.chapter}
            >
              <div className={styles.chapterMeta}>
                <span className={styles.chapterIndex}>{chapter.index}</span>
                <p className={styles.chapterKicker}>{chapter.kicker}</p>
              </div>
              <div className={styles.chapterBody}>
                <h2>{chapter.title}</h2>
                {index === 0 && <blockquote className={styles.pullQuote}>「{THESIS}」</blockquote>}
                <p>{chapter.body}</p>
                {chapter.key === 'authorBio4' && (
                  <div className={styles.workLinks}>
                    {FEATURED_WORKS.map((work) => (
                      <Link key={work.href} href={work.href} className={styles.workLink}>
                        <span>{work.kicker}</span>
                        <b>{work.title}</b>
                        <small>{work.copy}</small>
                        <i aria-hidden="true">↗</i>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        {skillGroups.length > 0 && (
          <section className={styles.skills} aria-label="能力图谱">
            <div className={styles.sectionHeading}>
              <div>
                <span>05 · CAPABILITY</span>
                <h2>能力图谱</h2>
              </div>
              <p>把图形、数据、模型与流程拆成可复用的工程能力，而不是停留在单点技术。</p>
            </div>
            <div className={styles.skillGrid}>
              {skillGroups.map((group, index) => (
                <article key={group.category}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{group.label}</h3>
                  <ul>
                    {group.names.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className={styles.closing}>
          <span>CONTINUE</span>
          <p>从概念到可运行产品。</p>
          <div className={styles.closingLinks}>
            <Link href="/projects">查看作品集</Link>
            <Link href="/articles">阅读文章</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
