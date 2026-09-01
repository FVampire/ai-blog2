'use client';

import styles from '../preview.module.css';
import { about } from '../mock';

export default function AboutScreen() {
  return (
    <div className={styles.aboutBody}>
      <div className={styles.pageHead}>
        <h1>{about.name}</h1>
        <p>{about.role}</p>
      </div>
      {about.bio.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}
