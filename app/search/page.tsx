'use client';

/**
 * 搜索结果页面
 * 支持向量搜索和普通搜索
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SearchResults from '../../components/SearchResults';
import { apiClient } from '../../lib/api-client';

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

interface SearchData {
  query: string;
  results: SearchResult[];
  total: number;
  searchType: 'vector' | 'text';
}

const searchPageStyles = `
.sp-search-page { min-height: 100vh; background: var(--bg-color); }
.sp-search-main { padding: 60px 20px; }
.sp-container { max-width: 900px; margin: 0 auto; }
.sp-search-hero { text-align: center; margin-bottom: 48px; }
.sp-search-title { font-size: 2.5rem; font-weight: 700; color: #1F2937; margin-bottom: 12px; }
.sp-search-subtitle { font-size: 1rem; color: #6B7280; margin-bottom: 32px; }
.sp-search-form { max-width: 700px; margin: 0 auto; }
.sp-search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 4px;
  transition: all 0.2s ease;
}
.sp-search-input-wrapper:focus-within {
  border-color: #FF6B6B;
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
}
.sp-search-icon { width: 20px; height: 20px; color: #9CA3AF; margin: 0 12px; flex-shrink: 0; }
.sp-search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 14px 0;
  font-size: 1rem;
  color: #1F2937;
  outline: none;
}
.sp-search-input::placeholder { color: #9CA3AF; }
.sp-clear-btn {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 8px;
  margin-right: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.sp-clear-btn:hover { opacity: 1; }
.sp-search-btn {
  position: relative;
  overflow: hidden;
  background: #E5E7EB;
  color: #374151;
  border: 1px solid #D1D5DB;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.sp-search-btn:hover:not(:disabled) { background: #F3F4F6; border-color: #9CA3AF; }
.sp-search-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.sp-search-type-toggle { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
.sp-type-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sp-type-btn:hover { border-color: #9CA3AF; color: #374151; }
.sp-type-btn.active { background: #F3F4F6; border-color: #D1D5DB; color: #374151; }
.sp-search-info { margin-top: 20px; }
.sp-info-text {
  font-size: 0.85rem;
  color: #6B7280;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.sp-info-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #F3F4F6;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.sp-search-content { min-height: 300px; }
.sp-error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 12px;
  margin-bottom: 24px;
}
.sp-results-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
}
.sp-results-progress { font-size: 0.85rem; color: #6B7280; }
.sp-load-more {
  background: #FFFFFF;
  color: #374151;
  border: 1px solid #D1D5DB;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sp-load-more:hover:not(:disabled) { background: #F3F4F6; border-color: #9CA3AF; }
.sp-load-more:disabled { opacity: 0.6; cursor: not-allowed; }
@media (max-width: 640px) {
  .sp-search-title { font-size: 1.75rem; }
  .sp-search-input-wrapper { flex-wrap: wrap; }
  .sp-search-input { width: 100%; order: 1; }
  .sp-search-btn { width: 100%; order: 3; margin-top: 8px; }
  .sp-search-type-toggle { flex-direction: column; align-items: stretch; }
  .sp-type-btn { justify-content: center; }
}
`;

const PAGE_SIZE = 10;

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q');
  const type = searchParams.get('type');

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'vector' | 'text'>('vector');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const performSearch = useCallback(async (
    searchQuery: string,
    nextSearchType: 'vector' | 'text',
    nextLimit: number,
  ) => {
    if (!searchQuery.trim()) return;

    const loadingMore = nextLimit > PAGE_SIZE;
    if (loadingMore) setIsLoadingMore(true);
    else setIsLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await apiClient.get<SearchData>(
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=${nextSearchType}&limit=${nextLimit}`,
      );

      if (response.success) {
        const list = response.data.results || [];
        setResults(list);
        setTotal(response.data.total ?? list.length);
        setHasMore(list.length >= nextLimit);
      } else {
        setError(response.message || '搜索失败');
        setResults([]);
        setTotal(0);
        setHasMore(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '搜索失败，请稍后重试';
      setError(message);
      setResults([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (type === 'text' || type === 'vector') setSearchType(type);
  }, [type]);

  useEffect(() => {
    if (q) {
      setQuery(q);
      setLimit(PAGE_SIZE);
      performSearch(q, (type as 'vector' | 'text') || 'vector', PAGE_SIZE);
    }
  }, [q, type, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLimit(PAGE_SIZE);
    router.push(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
    performSearch(query, searchType, PAGE_SIZE);
  };

  const handleTypeChange = (newType: 'vector' | 'text') => {
    setSearchType(newType);
    if (query.trim()) {
      setLimit(PAGE_SIZE);
      router.push(`/search?q=${encodeURIComponent(query)}&type=${newType}`);
      performSearch(query, newType, PAGE_SIZE);
    }
  };

  const handleLoadMore = () => {
    const nextLimit = limit + PAGE_SIZE;
    setLimit(nextLimit);
    performSearch(query, searchType, nextLimit);
  };

  return (
    <div className="sp-search-page">
      <style dangerouslySetInnerHTML={{ __html: searchPageStyles }} />
      <Header />

      <main className="sp-search-main">
        <div className="sp-container">
          <div className="sp-search-hero">
            <h1 className="sp-search-title">搜索文章</h1>
            <p className="sp-search-subtitle">输入关键词，发现你感兴趣的内容</p>

            <form onSubmit={handleSubmit} className="sp-search-form">
              <div className="sp-search-input-wrapper">
                <svg className="sp-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  className="sp-search-input"
                  placeholder="搜索文章标题、内容或标签..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                {query && (
                  <button type="button" className="sp-clear-btn" onClick={() => setQuery('')} aria-label="清除搜索">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
                <button type="submit" className="sp-search-btn" disabled={isLoading}>
                  {isLoading ? '搜索中...' : '搜索'}
                </button>
              </div>

              <div className="sp-search-type-toggle">
                <button type="button" className={`sp-type-btn ${searchType === 'vector' ? 'active' : ''}`} onClick={() => handleTypeChange('vector')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  AI 智能搜索
                </button>
                <button type="button" className={`sp-type-btn ${searchType === 'text' ? 'active' : ''}`} onClick={() => handleTypeChange('text')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                  普通搜索
                </button>
              </div>
            </form>

            <div className="sp-search-info">
              {searchType === 'vector' ? (
                <p className="sp-info-text">
                  <span className="sp-info-badge">AI</span>
                  智能搜索基于语义理解，可以找到意思相近但措辞不同的内容
                </p>
              ) : (
                <p className="sp-info-text">
                  <span className="sp-info-badge">文本</span>
                  普通搜索基于关键词匹配，精确匹配输入的文字
                </p>
              )}
            </div>
          </div>

          <div className="sp-search-content">
            {error && (
              <div className="sp-error-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {!error && searched && (
              <>
                <SearchResults
                  results={results}
                  query={q as string || ''}
                  searchType={searchType}
                  isLoading={isLoading}
                />

                {!isLoading && results.length > 0 && (
                  <div className="sp-results-footer">
                    <span className="sp-results-progress">
                      已显示 {results.length} 条{total > results.length ? ` / 共 ${total} 条` : ''}
                    </span>
                    {hasMore ? (
                      <button
                        type="button"
                        className="sp-load-more"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? '加载中…' : '加载更多'}
                      </button>
                    ) : (
                      <span className="sp-results-progress">已经到底了</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>}>
      <SearchContent />
    </Suspense>
  );
}
