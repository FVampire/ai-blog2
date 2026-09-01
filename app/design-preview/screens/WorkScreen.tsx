'use client';

import styles from '../preview.module.css';
import { projects } from '../mock';

export default function WorkScreen() {
  return (
    <div>
      <div className={styles.pageHead}>
        <h1>项目</h1>
        <p>单独陈列的作品，不和文章混在同一条时间线里。</p>
      </div>
      <div className={styles.projectGrid}>
        {projects.map((project) => (
          <article key={project.name} className={styles.projectCard}>
            <span>{project.year}</span>
            <strong>{project.name}</strong>
            <p>{project.blurb}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
