'use client';

import React, { useMemo, useState } from 'react';

import Link from 'next/link';

import { groupTags } from '../lib/tag-taxonomy';
import { useTags, type TagItem } from './useTags';

interface TagCloudProps {
  variant?: 'sidebar' | 'page';
  popularCount?: number;
}

function adjustBrightness(color: string, percent: number): string {
  if (!color) return color;
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function PopularPill({ tag }: { tag: TagItem }) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className="tag tag-with-count no-underline cursor-pointer"
      title={tag.name}
      style={{
        background: `linear-gradient(135deg, ${tag.color}, ${adjustBrightness(tag.color, 15)})`,
        boxShadow: `0 4px 15px ${tag.color}30`,
      }}
    >
      <span className="tag-label">{tag.name}</span>
      {tag.post_count > 0 && <span className="tag-count">{tag.post_count}</span>}
    </Link>
  );
}

function CatalogChip({ tag }: { tag: TagItem }) {
  return (
    <Link href={`/tags/${tag.slug}`} className="tag-chip" title={tag.name}>
      <span className="tag-chip-dot" style={{ background: tag.color }} aria-hidden="true" />
      <span className="tag-chip-label">{tag.name}</span>
      <span className="tag-chip-count">{tag.post_count}</span>
    </Link>
  );
}

const TagCloud: React.FC<TagCloudProps> = ({ variant = 'sidebar', popularCount = 8 }) => {
  const { tags, loading } = useTags();
  const [expanded, setExpanded] = useState(variant === 'page');
  const [query, setQuery] = useState('');

  const activeTags = useMemo(
    () => tags.filter((tag) => tag.post_count > 0),
    [tags]
  );

  const popularTags = useMemo(
    () => [...activeTags]
      .sort((a, b) => b.post_count - a.post_count || a.name.localeCompare(b.name, 'zh-CN'))
      .slice(0, popularCount),
    [activeTags, popularCount]
  );

  const filteredTags = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return activeTags;
    return activeTags.filter((tag) => (
      tag.name.toLowerCase().includes(needle) || tag.slug.toLowerCase().includes(needle)
    ));
  }, [activeTags, query]);

  const catalogGroups = useMemo(() => groupTags(filteredTags), [filteredTags]);
  const showToggle = variant === 'sidebar' && activeTags.length > popularCount;
  const showCatalog = variant === 'page' || expanded;

  if (loading || tags.length === 0) {
    return (
      <div className="card tag-cloud-card">
        <h2 className="section-title">标签</h2>
        <div className="tags-container">
          <p className="widget-placeholder">{loading ? '加载中...' : '暂无标签'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card tag-cloud-card tag-cloud-${variant} ${showCatalog ? 'is-expanded' : ''}`}>
      <div className="tag-cloud-header">
        <h2 className="section-title">标签</h2>
        {showToggle && (
          <button
            type="button"
            className="tag-cloud-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? '收起' : '展开'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <path d={expanded ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
            </svg>
          </button>
        )}
      </div>

      {!showCatalog && (
        <div className="tags-container">
          {popularTags.map((tag) => <PopularPill key={tag.id} tag={tag} />)}
        </div>
      )}

      {showCatalog && (
        <div className="tag-catalog">
          {activeTags.length > popularCount && (
            <label className="tag-catalog-search">
              <span className="sr-only">筛选标签</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="筛选标签"
              />
            </label>
          )}

          {catalogGroups.length === 0 ? (
            <p className="widget-placeholder">没有匹配的标签</p>
          ) : (
            catalogGroups.map((group) => (
              <section key={group.id} className="tag-catalog-group">
                <h3 className="tag-catalog-title">{group.label}</h3>
                <div className="tag-catalog-list">
                  {group.tags.map((tag) => <CatalogChip key={tag.id} tag={tag} />)}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {showToggle && !expanded && (
        <button
          type="button"
          className="tags-more"
          onClick={() => setExpanded(true)}
        >
          展开全部（{activeTags.length}）
        </button>
      )}
    </div>
  );
};

export default TagCloud;
