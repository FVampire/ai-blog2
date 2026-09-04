"use client";

import { useEffect, useState } from "react";

import styles from "./pattern-agent.module.css";

type NavItem = {
  id: string;
  index: string;
  title: string;
};

export default function StageNav({ stages }: { stages: readonly NavItem[] }) {
  const [active, setActive] = useState(stages[0]?.id ?? "");

  useEffect(() => {
    const nodes = stages
      .map((stage) => document.getElementById(stage.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.2, 0.45, 0.7] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [stages]);

  return (
    <nav className={styles.stageNav} aria-label="案例章节">
      <p>CASE STUDY</p>
      {stages.map((stage) => (
        <a
          key={stage.id}
          href={`#${stage.id}`}
          className={active === stage.id ? styles.navActive : undefined}
          aria-current={active === stage.id ? "location" : undefined}
        >
          <span>{stage.index}</span>
          <b>{stage.title}</b>
        </a>
      ))}
    </nav>
  );
}
