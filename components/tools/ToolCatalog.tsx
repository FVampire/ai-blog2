'use client';

import { useMemo } from 'react';
import { CATEGORIES } from '@/lib/tools/registry';
import { toolMatchesQuery, useToolsNav } from './ToolsNavContext';
import ToolCard from './ToolCard';
import styles from '@/app/tools/tools.module.css';

export default function ToolCatalog() {
  const { tools, query, category } = useToolsNav();

  const filtered = useMemo(
    () => tools.filter((tool) =>
      (category === 'all' || tool.category === category) && toolMatchesQuery(tool, query)),
    [category, query, tools],
  );

  const visibleCategories = category === 'all'
    ? CATEGORIES
    : CATEGORIES.filter((item) => item.key === category);

  return (
    <>
      {visibleCategories.map((item) => {
        const group = filtered.filter((tool) => tool.category === item.key);
        if (!group.length) return null;
        return (
          <section className={styles.category} key={item.key} id={item.key}>
            {category === 'all' && (
              <header className={styles.categoryHeading}>
                <h2>{item.name}</h2>
                <p className={styles.categoryDesc}>{group.length} 个</p>
              </header>
            )}
            <div className={styles.grid}>
              {group.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
            </div>
          </section>
        );
      })}

      {!filtered.length && (
        <div className={styles.empty}>
          <strong>没有找到匹配的工具</strong>
          试试更短的关键词，或换一个分类。
        </div>
      )}
    </>
  );
}
