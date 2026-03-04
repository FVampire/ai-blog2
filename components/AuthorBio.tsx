import React from 'react';

const AuthorBio: React.FC = () => {
  return (
    <div className="card">
      <h2 className="section-title">About Me</h2>
      <div className="avatar"></div>
      <h3 className="author-name">John Doe</h3>
      <p className="author-bio">
        Full-stack developer with a passion for creating beautiful and functional web applications.
        I write about technology, design, and my journey in the tech industry.
      </p>
      <div className="social-links">
        <a href="#" className="social-link">Twitter</a>
        <a href="#" className="social  -link">GitHub</a>
        <a href="#" className="social-link">LinkedIn</a>
      </div>
    </div>
  );
};

export default AuthorBio;