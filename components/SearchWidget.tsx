import React from 'react';

const SearchWidget: React.FC = () => {
  return (
    <div className="card">
      <h2 className="section-title">Search</h2>
      <div className="search-box">
        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search articles..."
        />
      </div>
    </div>
  );
};

export default SearchWidget;