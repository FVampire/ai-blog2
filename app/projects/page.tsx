import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import BlogPostCard from '../../components/BlogPostCard';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import ProjectCard from '../../components/ProjectCard';
import { ProjectRepository } from '../../lib/repositories/ProjectRepository';
import { SettingsRepository } from '../../lib/repositories/SettingsRepository';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await SettingsRepository.getProjectDisplaySettings();
    return {
      title: settings.navLabel,
      description: settings.intro,
    };
  } catch {
    return { title: 'Projects' };
  }
}

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof ProjectRepository.getAllProjects>> = [];
  let settings = {
    intro: '我的项目与开发成果',
    navLabel: 'Projects',
    enabled: true,
  };

  try {
    settings = await SettingsRepository.getProjectDisplaySettings();
    projects = await ProjectRepository.getAllProjects({ status: 'active' });
  } catch (error) {
    console.error('Error fetching projects:', error);
  }

  const featured = projects.filter((p) => p.featured);
  const regular = projects.filter((p) => !p.featured);

  return (
    <div>
      <Header />

      <div className="container">
        <div className="content-wrapper projects-page-layout">
          <div className="main-content">
            <div className="projects-page-hero">
              <h1 className="section-title projects-page-title">{settings.navLabel}</h1>
              <p className="projects-section-intro">{settings.intro}</p>
            </div>

            {projects.length === 0 ? (
              <div className="card">
                <p className="author-bio">暂无项目。在管理后台「项目管理」中创建，或通过 Agent API 注册。</p>
              </div>
            ) : (
              <>
                {featured.length > 0 && (
                  <section className="projects-section">
                    <h2 className="section-title" style={{ fontSize: '20px' }}>精选项目</h2>
                    <div className="projects-grid">
                      {featured.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  </section>
                )}

                {regular.length > 0 && (
                  <section className="projects-section">
                    {featured.length > 0 && (
                      <h2 className="section-title" style={{ fontSize: '20px' }}>全部项目</h2>
                    )}
                    <div className="projects-grid">
                      {regular.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
