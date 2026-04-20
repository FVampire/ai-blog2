/**
 * 搜索结果页面
 * 支持向量搜索和普通搜索
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchResults from '../components/SearchResults';
import { apiClient } from '../lib/api-client';

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

export default function SearchPage() {
  const router = useRouter();
  const { q, type } = router.query;

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'vector' | 'text'>('vector');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // 从URL参数初始化搜索
  useEffect(() => {
    if (q && typeof q === 'string') {
      setQuery(q);
      performSearch(q, (type as 'vector' | 'text') || 'vector');
    }
  }, [q, type]);

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string, searchType: 'vector' | 'text') => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await apiClient.get<SearchData>(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);

      if (response.success) {
        setResults(response.data.results);
        setTotal(response.data.total);
      } else {
        setError(response.message || '搜索失败');
        setResults([]);
        setTotal(0);
      }
    } catch (err: any) {
      setError(err.message || '搜索失败，请稍后重试');
      setResults([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 提交搜索
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // 更新URL参数
    router.push({
      pathname: '/search',
      query: { q: query, type: searchType },
    }, undefined, { shallow: true });

    performSearch(query, searchType);
  };

  // 切换搜索类型
  const handleTypeChange = (newType: 'vector' | 'text') => {
    setSearchType(newType);
    if (query.trim()) {
      router.push({
        pathname: '/search',
        query: { q: query, type: newType },
      }, undefined, { shallow: true });
      performSearch(query, newType);
    }
  };

  return (
    <div className="search-page">
      <Head>
        <title>{q ? `${q} - 搜索结果` : '搜索'} | 我的博客</title>
        <meta name="description" content="搜索博客文章" />
      </Head>

      <Header />

      <main className="search-main">
        <div className="container">
          <div className="search-hero">
            <h1 className="search-title">搜索文章</h1>
            <p className="search-subtitle">输入关键词，发现你感兴趣的内容</p>

            {/* 搜索框 */}
            <form onSubmit={handleSubmit} className="search-form">
              <div className="search-input-wrapper">
                <svg
                  className="search-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="搜索文章标题、内容或标签..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => setQuery('')}
                    aria-label="清除搜索"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
                <button type="submit" className="search-btn" disabled={isLoading}>
                  {isLoading ? '搜索中...' : '搜索'}
                </button>
              </div>

              {/* 搜索类型切换 */}
              <div className="search-type-toggle">
                <button
                  type="button"
                  className={`type-btn ${searchType === 'vector' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('vector')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  AI 智能搜索
                </button>
                <button
                  type="button"
                  className={`type-btn ${searchType === 'text' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('text')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                  普通搜索
                </button>
              </div>
            </form>

            {/* 搜索类型说明 */}
            <div className="search-info">
              {searchType === 'vector' ? (
                <p className="info-text">
                  <span className="info-badge">AI</span>
                  智能搜索基于语义理解，可以找到意思相近但措辞不同的内容
                </p>
              ) : (
                <p className="info-text">
                  <span className="info-badge">文本</span>
                  普通搜索基于关键词匹配，精确匹配输入的文字
                </p>
              )}
            </div>
          </div>

          {/* 搜索结果 */}
          <div className="search-content">
            {error && (
              <div className="error-message">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {!error && searched && (
              <SearchResults
                results={results}
                query={q as string || ''}
                searchType={searchType}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .search-page {
          min-height: 100vh;
          background: var(--bg-color);
        }

        .search-main {
          padding: 60px 20px;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
        }

        .search-hero {
          text-align: center;
          margin-bottom: 48px;
        }

        .search-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 12px;
        }

        .search-subtitle {
          font-size: 1rem;
          color: #6B7280;
          margin-bottom: 32px;
        }

        .search-form {
          max-width: 700px;
          margin: 0 auto;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          padding: 4px;
          transition: all 0.2s ease;
        }

        .search-input-wrapper:focus-within {
          border-color: #FF6B6B;
          box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
        }

        .search-icon {
          width: 20px;
          height: 20px;
          color: #9CA3AF;
          margin: 0 12px;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 14px 0;
          font-size: 1rem;
          color: #1F2937;
          outline: none;
        }

        .search-input::placeholder {
          color: #9CA3AF;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          cursor: pointer;
          padding: 8px;
          margin-right: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .clear-btn:hover {
          opacity: 1;
        }

        .search-btn {
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

        .search-btn:hover:not(:disabled) {
          background: #F3F4F6;
          border-color: #9CA3AF;
        }

        .search-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.6),
            transparent
          );
          transition: left 0.5s ease;
        }

        .search-btn:hover::before {
          left: 100%;
        }

        .search-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .search-type-toggle {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 20px;
        }

        .type-btn {
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

        .type-btn:hover {
          border-color: #9CA3AF;
          color: #374151;
        }

        .type-btn.active {
          background: #F3F4F6;
          border-color: #D1D5DB;
          color: #374151;
        }

        .search-info {
          margin-top: 20px;
        }

        .info-text {
          font-size: 0.85rem;
          color: #6B7280;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .info-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #F3F4F6;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .search-content {
          min-height: 300px;
        }

        .error-message {
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

        @media (max-width: 640px) {
          .search-title {
            font-size: 1.75rem;
          }

          .search-input-wrapper {
            flex-wrap: wrap;
          }

          .search-input {
            width: 100%;
            order: 1;
          }

          .search-btn {
            width: 100%;
            order: 3;
            margin-top: 8px;
          }

          .search-type-toggle {
            flex-direction: column;
            align-items: stretch;
          }

          .type-btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
