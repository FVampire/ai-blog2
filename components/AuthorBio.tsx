import React from 'react';

interface AuthorBioProps {
  name?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: Array<{ platform: string; name: string; url: string }>;
}

const AuthorBio: React.FC<AuthorBioProps> = ({
  name = 'John Doe',
  bio = 'Full-stack developer with a passion for creating beautiful and functional web applications. I write about technology, design, and my journey in the tech industry.',
  socialLinks = [
    { platform: 'Twitter', name: 'Twitter', url: '#' },
    { platform: 'GitHub', name: 'GitHub', url: '#' },
    { platform: 'LinkedIn', name: 'LinkedIn', url: '#' },
  ]
}) => {
  return (
    <div className="card">
      <h2 className="section-title">About Me</h2>
      <div className="avatar"></div>
      <h3 className="author-name">{name}</h3>
      <p className="author-bio">{bio}</p>
      <div className="social-links">
        {socialLinks.map((link, index) => (
          <a key={index} href={link.url} className="social-link">{link.name}</a>
        ))}
      </div>
    </div>
  );
};

export default AuthorBio;
