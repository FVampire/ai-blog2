import React, { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 解析 Markdown 中的标题
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));

    const extractedHeadings: Heading[] = matches.map((match) => {
      const level = match[1].length;
      const text = match[2].trim();
      // 生成与 rehype-slug 相同的 ID：小写、空格转连字符、移除特殊字符
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      return { id, text, level };
    });

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    // 监听滚动，更新当前激活的标题
    const handleScroll = () => {
      const headingElements = headings.map(h =>
        document.getElementById(h.id)
      ).filter(Boolean);

      const currentHeading = headingElements.find((element, index) => {
        if (!element) return false;
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

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始化

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // 留出顶部空间
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="toc-container">
      <div className="toc-header">目录</div>
      <nav className="toc-nav">
        {headings.map((heading, index) => (
          <a
            key={heading.id + index}
            href={`#${heading.id}`}
            className={`toc-link toc-level-${heading.level} ${activeId === heading.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToHeading(heading.id);
            }}
            style={{
              paddingLeft: `${(heading.level - 1) * 12}px`,
            }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
};

export default TableOfContents;
