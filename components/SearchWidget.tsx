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
          <title>Search</title>
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
            <title>Search</title>
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
          background: linear-gradient(135deg, #FF6B6B, #FF8C42);
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
        }
        .search-submit:hover {
          transform: translateX(2px) scale(1.05);
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
        }
      `}</style>
    </div>
  );
};

export default SearchWidget;