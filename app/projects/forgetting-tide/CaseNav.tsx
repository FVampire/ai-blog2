'use client';

import { useEffect, useState } from 'react';

import styles from './forgetting-tide.module.css';

const sections = [
  ['world', '世界'],
  ['cast', '角色'],
  ['companions', '生物'],
  ['story', '剧情案例'],
  ['gameplay', '单局流程'],
  ['systems', '系统设计'],
  ['product', '最终界面'],
  ['process', '开发过程'],
  ['soundtrack', '配乐'],
  ['next-tides', '后续'],
] as const;

export default function CaseNav() {
  const [active, setActive] = useState<string>(sections[0][0]);

  useEffect(() => {
    const targets = sections
      .map(([id]) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className={styles.caseNav} aria-label="案例目录">
      <span>CASE INDEX</span>
      {sections.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className={active === id ? styles.caseNavActive : undefined}
          aria-current={active === id ? 'true' : undefined}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
