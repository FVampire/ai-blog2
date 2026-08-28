import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import styles from './projects.module.css';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import ProjectCard from '../../components/ProjectCard';
import { ProjectRepository } from '../../lib/repositories/ProjectRepository';
import { SettingsRepository } from '../../lib/repositories/SettingsRepository';

export const dynamic = 'force-dynamic';

const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

function buildMetadata(title: string, description: string): Metadata {
  const url = `${SITE_URL}/projects`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'zh_CN',
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-default.png'],
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await SettingsRepository.getProjectDisplaySettings();
    return buildMetadata(settings.navLabel, settings.intro);
  } catch {
    return buildMetadata('作品集', '游戏、设计与技术项目成果。');
  }
}

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof ProjectRepository.getAllProjects>> = [];
  let settings = {
    intro: '这里收录从概念、系统、视觉到可运行原型的完整创作。',
    navLabel: '作品集',
    enabled: true,
  };

  try {
    settings = await SettingsRepository.getProjectDisplaySettings();
    projects = await ProjectRepository.getAllProjects({ status: 'active' });
  } catch (error) {
    console.error('Error fetching projects:', error);
  }

  const managedProjects = projects.filter((project) => project.slug !== 'forgetting-tide');
  const featured = managedProjects.filter((project) => project.featured);
  const regular = managedProjects.filter((project) => !project.featured);
  const total = managedProjects.length + 1;

  return (
    <div>
      <Header projectsNavLabel={settings.navLabel} projectsEnabled={settings.enabled} />
      <main className={styles.page}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>PORTFOLIO · {String(total).padStart(2, '0')} SELECTED WORKS</p>
          <div className={styles.introGrid}>
            <h1>作品集｜设计、开发<br />与视听创作案例</h1>
            <div className={styles.introCopy}>
              <p>{settings.intro}</p>
              <p>每个案例单独标注项目类型、负责范围与核心交付物，不把作品集限定在某一种媒介里。</p>
            </div>
          </div>
        </header>

        <div className={styles.portfolioMap}>
          <div><span>01</span><b>产品与 Web</b><small>架构 / 前后端 / AI 工具</small></div>
          <div><span>02</span><b>游戏与交互</b><small>企划 / 系统 / 产品实现</small></div>
          <div><span>03</span><b>视觉与声音</b><small>世界设定 / 概念美术 / 配乐</small></div>
        </div>

        <div className={styles.projectIndex} aria-label="项目索引">
          <span>01</span><b>遗忘潮汐</b><p>独立游戏设计</p><p>主创 / 企划 / 系统 / 音乐</p><p>完整产品案例</p><i>2026</i>
        </div>

        <section className={styles.workGroup}>
          <div className={styles.workGroupHeading}>
            <div><span>01 / GAME &amp; INTERACTIVE</span><h2>游戏与交互设计</h2></div>
            <p>完整产品案例：企划、系统、剧情、美术、界面与声音在同一套世界规则下落地。</p>
          </div>
          <Link className={styles.projectCard} href="/projects/forgetting-tide">
            <div className={styles.cover}>
              <Image
                src="/projects/forgetting-tide/hero.png"
                alt="寻潮者与残响生物望向记忆灯塔"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 62vw"
              />
              <span className={styles.status}>COMPLETE PRODUCT CASE</span>
              <span className={styles.index}>01 / {String(total).padStart(2, '0')}</span>
            </div>
            <div className={styles.cardInfo}>
              <div>
                <p className={styles.cardKicker}>FEATURED CASE STUDY · 2026</p>
                <h3>遗忘潮汐 <i>The Forgetting Tide</i></h3>
              </div>
              <p className={styles.summary}>
                一款关于记忆、见证与现实选择的叙事构筑游戏。完整展示玩法循环、首章剧情、最终界面、场景美术与原创配乐。
              </p>
              <ul className={styles.deliverables}>
                <li>游戏与战斗企划</li><li>世界设定与首章剧情</li><li>最终产品界面</li><li>原创配乐与场景美术</li>
              </ul>
              <span className={styles.caseLink}>查看完整案例 <i aria-hidden="true">↗</i></span>
            </div>
          </Link>
        </section>

        {managedProjects.length > 0 ? (
          <div className={styles.managedProjects}>
            {featured.length > 0 && (
              <section className={styles.managedSection}>
                <div className={styles.managedHeading}>
                  <span>FEATURED</span>
                  <h2>更多精选项目</h2>
                </div>
                <div className="projects-grid">
                  {featured.map((project) => <ProjectCard key={project.id} project={project} />)}
                </div>
              </section>
            )}

            {regular.length > 0 && (
              <section className={styles.managedSection}>
                <div className={styles.managedHeading}>
                  <span>ARCHIVE</span>
                  <h2>{featured.length > 0 ? '全部项目' : '更多项目'}</h2>
                </div>
                <div className="projects-grid">
                  {regular.map((project) => <ProjectCard key={project.id} project={project} />)}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className={styles.archiveNote}>
            <span>ARCHIVE STATUS</span>
            <p>更多实验与作品会在完成可展示的叙事闭环后加入。</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
