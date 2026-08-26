'use client';

import React, { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

/** Match rehype-slug: lowercase, spaces to hyphens, collapse dashes */
function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));

    const extractedHeadings: Heading[] = matches.map((match) => {
      const level = match[1].length;
      const text = match[2].trim().replace(/\s+#+\s*$/, '');
      return { id: slugifyHeading(text), text, level };
    });

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];

      const currentHeading = headingElements.find((element, index) => {
        const rect = element.getBoundingClientRect();
        const nextElement = headingElements[index + 1];

        if (nextElement) {
          const nextRect = nextElement.getBoundingClientRect();
          return rect.top <= 100 && nextRect.top > 100;
        }

        return rect.top <= 100;
      });

      if (currentHeading) {
        setActiveId(currentHeading.id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

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
