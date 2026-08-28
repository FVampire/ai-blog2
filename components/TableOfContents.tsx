'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

const ARTICLE_CONTAINER_SELECTOR = '.markdown-preview';
const HEADING_SELECTOR = 'h1, h2, h3';
const SCROLL_OFFSET = 80;

function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseHeadingsFromMarkdown(content: string): Heading[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;

  return Array.from(content.matchAll(headingRegex)).map((match) => {
    const level = match[1].length;
    const text = match[2].trim().replace(/\s+#+\s*$/, '');
    return { id: slugifyHeading(text), text, level };
  });
}

function sameHeadings(a: Heading[], b: Heading[]): boolean {
  return a.length === b.length && a.every((heading, index) => heading.id === b[index].id && heading.text === b[index].text);
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const initialHeadings = useMemo(() => parseHeadingsFromMarkdown(content), [content]);
  const [headings, setHeadings] = useState<Heading[]>(initialHeadings);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    setHeadings(initialHeadings);
  }, [initialHeadings]);

  useEffect(() => {
    const container = document.querySelector(ARTICLE_CONTAINER_SELECTOR);
    if (!container) return;

    const collect = () => {
      const fromDom = Array.from(container.querySelectorAll<HTMLElement>(HEADING_SELECTOR))
        .filter((element) => element.id)
        .map((element) => ({
          id: element.id,
          text: element.textContent?.trim() ?? '',
          level: Number(element.tagName.slice(1)) || 1,
        }));

      setHeadings((previous) => (sameHeadings(previous, fromDom) ? previous : fromDom));
    };

    collect();

    const mutationObserver = new MutationObserver(collect);
    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => mutationObserver.disconnect();
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const visibleIds = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        });

        const firstVisible = headings.find((heading) => visibleIds.has(heading.id));
        if (firstVisible) {
          setActiveId(firstVisible.id);
          return;
        }

        const passed = elements.filter(
          (element) => element.getBoundingClientRect().top < SCROLL_OFFSET
        );
        if (passed.length > 0) {
          setActiveId(passed[passed.length - 1].id);
        }
      },
      { rootMargin: `-${SCROLL_OFFSET}px 0px -65% 0px`, threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: elementPosition - SCROLL_OFFSET,
      behavior: 'smooth',
    });
  }, []);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="toc-card">
      <h2 className="toc-title">目录</h2>
      <nav className="toc-nav" aria-label="文章目录">
        <ul className="toc-list">
          {headings.map((heading, index) => (
            <li
              key={`${heading.id}-${index}`}
              className={`toc-item toc-level-${heading.level} ${activeId === heading.id ? 'is-active' : ''}`}
            >
              <a
                href={`#${heading.id}`}
                className="toc-link"
                aria-current={activeId === heading.id ? 'location' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHeading(heading.id);
                }}
              >
                <span className="toc-text">{heading.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default TableOfContents;
