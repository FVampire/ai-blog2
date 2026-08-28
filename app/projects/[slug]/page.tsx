import React from 'react';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import { formatDate } from '../../../lib/format';
import { ProjectRepository } from '../../../lib/repositories/ProjectRepository';

export const dynamic = 'force-dynamic';

const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await ProjectRepository.getProjectBySlug(slug);
    if (project) {
      const description = project.description || `${project.name} - 项目详情`;
      const url = `${SITE_URL}/projects/${project.slug}`;
      const image = project.imageUrl || '/og-default.png';
      return {
        title: project.name,
        description,
        alternates: { canonical: url },
        openGraph: {
          type: 'article',
          title: project.name,
          description,
          url,
          siteName: SITE_NAME,
          locale: 'zh_CN',
          images: [{ url: image, alt: project.name }],
        },
        twitter: {
          card: 'summary_large_image',
          title: project.name,
          description,
          images: [image],
        },
      };
    }
  } catch {
    // ignore
  }
  return { title: '项目未找到' };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  let project: Awaited<ReturnType<typeof ProjectRepository.getProjectBySlug>> = null;
  let posts: Awaited<ReturnType<typeof ProjectRepository.getProjectPosts>> = [];

  try {
    project = await ProjectRepository.getProjectBySlug(slug);
    if (project) {
      posts = await ProjectRepository.getProjectPosts(project.id);
    }
  } catch (error) {
    console.error('Error fetching project:', error);
  }

  if (!project) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="card" style={{ marginTop: 40 }}>
            <h1>项目不存在</h1>
            <Link href="/projects" className="projects-view-all">← 返回项目列表</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <Link href="/projects" className="projects-view-all" style={{ display: 'block', marginBottom: 24 }}>
              ← 返回项目列表
            </Link>

            <div className="project-detail-hero card">
              {project.imageUrl && (
                <Image
                  src={project.imageUrl}
                  alt={project.name}
                  width={1200}
                  height={630}
                  priority
                  sizes="(max-width: 768px) 100vw, 760px"
                  className="project-detail-hero-image"
                  unoptimized
                />
              )}

              <h1 className="section-title">{project.name}</h1>

              {project.featured && (
                <span className="project-card-badge" style={{ position: 'static', display: 'inline-block', marginBottom: 16 }}>
                  精选
                </span>
              )}

              {project.description && (
                <p className="author-bio" style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
                  {project.description}
                </p>
              )}

              {project.techStack.length > 0 && (
                <div className="project-detail-meta">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="project-card-tag">{tech}</span>
                  ))}
                </div>
              )}

              <div className="project-detail-actions">
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="project-detail-btn project-detail-btn-primary">
                    查看源码
                  </a>
                )}
                {project.demoUrl && (
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="project-detail-btn project-detail-btn-secondary">
                    在线演示
                  </a>
                )}
              </div>
            </div>

            {posts.length > 0 && (
              <section className="project-related-posts">
                <h2 className="section-title">相关文章</h2>
                <div className="grid gap-4">
                  {posts.map((post) => (
                    <Link key={post.id} href={`/posts/${post.slug}`} className="card block" style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {post.imageUrl && (
                          <Image
                            src={post.imageUrl}
                            alt=""
                            width={80}
                            height={60}
                            unoptimized
                            style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }}
                          />
                        )}
                        <div>
                          <h3 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{post.title}</h3>
                          {post.excerpt && (
                            <p className="author-bio" style={{ fontSize: 14 }}>{post.excerpt}</p>
                          )}
                          {post.publishedAt && (
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {formatDate(post.publishedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
