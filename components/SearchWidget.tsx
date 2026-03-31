import React, { useState } from 'react';
import { useRouter } from 'next/router';

const SearchWidget: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title">Search</h2>
      <form onSubmit={handleSubmit} className="search-box">
        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="search-submit" aria-label="搜索">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </form>

      <style jsx>{`
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-submit {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          opacity: 0.7;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-submit:hover {
          opacity: 1;
          color: var(--primary-color);
          transform: translateX(2px);
        }
      `}</style>
    </div>
  );
};

export default SearchWidget;