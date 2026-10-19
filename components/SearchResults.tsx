'use client';

/**
 * SearchResults 组件
 * 展示搜索结果，包括匹配率、命中文字片段等
 */

import Image from 'next/image';
import React from 'react';

import Link from 'next/link';

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  author: string;
  date: string;
  tags: string[];
  views: number;
  similarity: number;
  matchedSnippets: string[];
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  searchType: 'vector' | 'text';
  isLoading: boolean;
}

/**
 * 获取匹配率的颜色
 */
function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.8) return '#10b981'; // 绿色 - 高匹配
  if (similarity >= 0.6) return '#3b82f6'; // 蓝色 - 中匹配
  if (similarity >= 0.4) return '#f59e0b'; // 橙色 - 低匹配
  return '#6b7280'; // 灰色 - 弱匹配
}

/**
 * 获取匹配率标签
 */
function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.8) return '非常相关';
  if (similarity >= 0.6) return '相关';
  if (similarity >= 0.4) return '可能相关';
  return '弱相关';
}

/**
 * 高亮匹配的文本
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '2px 4px',
              borderRadius: '4px',
              fontWeight: 500,
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const searchResultsStyles = `
.sr-search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6B7280;
}
.sr-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E5E7EB;
  border-top-color: #FF6B6B;
  border-radius: 50%;
  animation: sr-spin 0.8s linear infinite;
  margin-bottom: 16px;
}
@keyframes sr-spin {
  to { transform: rotate(360deg); }
}
.sr-search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6B7280;
  text-align: center;
}
.sr-search-empty svg { margin-bottom: 20px; opacity: 0.5; }
.sr-search-empty h3 { font-size: 1.25rem; margin-bottom: 8px; color: #374151; }
.sr-search-empty p { font-size: 0.9rem; }
.sr-search-results { width: 100%; }
.sr-search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E7EB;
}
.sr-search-type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sr-search-type-badge[data-type='vector'] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}
.sr-search-type-badge[data-type='text'] {
  background: #E5E7EB;
  color: #4B5563;
}
.sr-result-count { font-size: 0.9rem; color: #6B7280; }
.sr-results-list { display: flex; flex-direction: column; gap: 20px; }
.sr-result-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.sr-result-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #D1D5DB;
}
.sr-similarity-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.sr-similarity-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  padding: 4px;
}
.sr-similarity-inner {
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sr-similarity-value { font-size: 0.875rem; font-weight: 700; color: #1F2937; }
.sr-similarity-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sr-result-content { flex: 1; min-width: 0; }
.sr-result-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1F2937;
  text-decoration: none;
  display: block;
  margin-bottom: 12px;
  line-height: 1.4;
}
.sr-result-title:hover { color: #FF6B6B; }
.sr-matched-snippets {
  background: #FFFBEB;
  border-left: 3px solid #F59E0B;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 0 8px 8px 0;
}
.sr-snippet-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400E;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 8px;
}
.sr-snippet-text {
  font-size: 0.875rem;
  color: #78350F;
  line-height: 1.6;
  margin: 0;
  font-style: italic;
}
.sr-result-excerpt {
  font-size: 0.95rem;
  color: #6B7280;
  line-height: 1.7;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.sr-result-meta { display: flex; gap: 20px; flex-wrap: wrap; }
.sr-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #6B7280;
}
.sr-meta-item svg { opacity: 0.6; }
.sr-result-image {
  width: 160px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
}
.sr-result-image img { width: 100%; height: 100%; object-fit: cover; }
@media (max-width: 640px) {
  .sr-result-card { flex-direction: column; gap: 16px; }
  .sr-similarity-badge { flex-direction: row; justify-content: flex-start; }
  .sr-similarity-ring { width: 48px; height: 48px; }
  .sr-result-image { width: 100%; height: 180px; }
  .sr-search-header { flex-direction: column; gap: 12px; align-items: flex-start; }
}
`;

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  searchType,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: searchResultsStyles }} />
        <div className="sr-search-loading">
          <div className="sr-loading-spinner"></div>
          <p>正在搜索...</p>
        </div>
      </>
    );
  }

  if (!results) {
    results = [];
  }
  if (results?.length === 0) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: searchResultsStyles }} />
        <div className="sr-search-empty">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <h3>未找到相关结果</h3>
          <p>尝试使用不同的关键词或检查拼写</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: searchResultsStyles }} />
      <div className="sr-search-results">
        <div className="sr-search-header">
          <span className="sr-search-type-badge" data-type={searchType}>
            {searchType === 'vector' ? 'AI 智能搜索' : '普通搜索'}
          </span>
          <span className="sr-result-count">找到 {results.length} 个结果</span>
        </div>

        <div className="sr-results-list">
          {results.map((result) => (
            <article key={result.id} className="sr-result-card">
              {/* 匹配率指示器 */}
              <div className="sr-similarity-badge">
                <div
                  className="sr-similarity-ring"
                  style={{
                    background: `conic-gradient(${getSimilarityColor(result.similarity)} ${
                      result.similarity * 360
                    }deg, #e5e7eb 0deg)`,
                  }}
                >
                  <div className="sr-similarity-inner">
                    <span className="sr-similarity-value">{Math.round(result.similarity * 100)}%</span>
                  </div>
                </div>
                <span
                  className="sr-similarity-label"
                  style={{ color: getSimilarityColor(result.similarity) }}
                >
                  {getSimilarityLabel(result.similarity)}
                </span>
              </div>

              {/* 文章内容 */}
              <div className="sr-result-content">
                <Link href={`/posts/${result.slug}`} className="sr-result-title">
                  <HighlightedText text={result.title} query={query} />
                </Link>

                {/* 命中文字片段 */}
                {result.matchedSnippets.length > 0 && (
                  <div className="sr-matched-snippets">
                    <span className="sr-snippet-label">匹配内容：</span>
                    {result.matchedSnippets.map((snippet, idx) => (
                      <p key={idx} className="sr-snippet-text">
                        &quot;<HighlightedText text={snippet} query={query} />&quot;
                      </p>
                    ))}
                  </div>
                )}

                <p className="sr-result-excerpt">
                  <HighlightedText text={result.excerpt} query={query} />
                </p>

                <div className="sr-result-meta">
                  <span className="sr-meta-item">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {result.author}
                  </span>
                  <span className="sr-meta-item">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {result.date}
                  </span>
                  <span className="sr-meta-item">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {result.views} 阅读
                  </span>
                </div>
              </div>

              {result.image && (
                <div className="sr-result-image">
                  <Image src={result.image} alt={result.title} width={120} height={80} style={{ objectFit: 'cover' }} />
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default SearchResults;
