import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export interface ProjectCardData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  featured?: boolean;
  postCount?: number;
}

interface ProjectCardProps {
  project: ProjectCardData;
  variant?: 'default' | 'compact';
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, variant = 'default' }) => {
  const isCompact = variant === 'compact';

  return (
    <article className={`project-card ${isCompact ? 'project-card-compact' : ''}`}>
      <Link href={`/projects/${project.slug}`} className="project-card-image-link">
        <div className="project-card-image-wrapper">
          {project.imageUrl ? (
            <Image
              src={project.imageUrl}
              alt={project.name}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="project-card-image"
            />
          ) : (
            <div className="project-card-placeholder">
              <span>{project.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          {project.featured && <span className="project-card-badge">Featured</span>}
        </div>
      </Link>

      <div className="project-card-body">
        {project.techStack.length > 0 && (
          <div className="project-card-tags">
            {project.techStack.slice(0, 4).map((tech) => (
              <span key={tech} className="project-card-tag">{tech}</span>
            ))}
            {project.techStack.length > 4 && (
              <span className="project-card-tag project-card-tag-more">+{project.techStack.length - 4}</span>
            )}
          </div>
        )}

        <h2 className="project-card-title">
          <Link href={`/projects/${project.slug}`}>{project.name}</Link>
        </h2>

        {project.description && !isCompact && (
          <p className="project-card-desc">{project.description}</p>
        )}

        <div className="project-card-footer">
          <div className="project-card-links">
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="project-card-link">
                源码
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="project-card-link project-card-link-demo">
                演示
              </a>
            )}
          </div>
          <Link href={`/projects/${project.slug}`} className="project-card-readmore">
            查看详情
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
