import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import ProjectCard from '../../components/ProjectCard';
import { ProjectRepository } from '../../lib/repositories/ProjectRepository';
import { SettingsRepository } from '../../lib/repositories/SettingsRepository';
import styles from './projects.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await SettingsRepository.getProjectDisplaySettings();
    return {
      title: `${settings.navLabel} - 五月的火`,
      description: settings.intro,
    };
  } catch {
    return {
      title: 'Projects - 五月的火',
      description: '游戏、设计与技术项目成果。',
    };
  }
}

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof ProjectRepository.getAllProjects>> = [];
  let settings = {
    intro: '这里收录从概念、系统、视觉到可运行原型的完整创作。',
    navLabel: 'Projects',
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
          <p className={styles.eyebrow}>SELECTED WORK · {String(total).padStart(2, '0')}</p>
          <div className={styles.introGrid}>
            <h1>项目不是清单，<br />而是一段被完成的思考。</h1>
            <div className={styles.introCopy}>
              <p>{settings.intro}</p>
              <p>第一项是一款关于记忆、见证与现实选择的叙事构筑游戏。</p>
            </div>
          </div>
        </header>

        <Link className={styles.projectCard} href="/projects/forgetting-tide">
          <div className={styles.cover}>
            <Image
              src="/projects/forgetting-tide/hero.png"
              alt="寻潮者与残响生物望向记忆灯塔"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 72vw"
            />
            <span className={styles.status}>PLAYABLE PROTOTYPE</span>
            <span className={styles.index}>01 / {String(total).padStart(2, '0')}</span>
          </div>
          <div className={styles.cardInfo}>
            <div>
              <p className={styles.cardKicker}>GAME DESIGN · GODOT · ORIGINAL SOUNDTRACK</p>
              <h2>遗忘潮汐 <i>The Forgetting Tide</i></h2>
            </div>
            <p className={styles.summary}>
              带领三只残响生物进入不断改写自身的遗迹，让彼此矛盾的证词共同塑造现实。
            </p>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </div>
        </Link>

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
