import Link from 'next/link';
import React from 'react';

import ProjectCard, { ProjectCardData } from '../ProjectCard';

interface ProjectsSectionProps {
  projects: ProjectCardData[];
  title?: string;
  intro?: string;
  showViewAll?: boolean;
  variant?: 'default' | 'compact';
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  title = '项目',
  intro,
  showViewAll = true,
  variant = 'default',
}) => {
  if (projects.length === 0) return null;

  return (
    <section className="projects-section">
      <div className="projects-section-header">
        <div>
          <h2 className="section-title">{title}</h2>
          {intro && <p className="projects-section-intro">{intro}</p>}
        </div>
        {showViewAll && (
          <Link href="/projects" className="projects-view-all">
            查看全部 →
          </Link>
        )}
      </div>
      <div className={`projects-grid ${variant === 'compact' ? 'projects-grid-compact' : ''}`}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} variant={variant} />
        ))}
      </div>
    </section>
  );
};

export default ProjectsSection;
