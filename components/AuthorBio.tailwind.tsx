'use client';

import React from 'react';

import Link from 'next/link';

interface AuthorBioProps {
  name?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
}

const AuthorBio: React.FC<AuthorBioProps> = ({
  name = 'John Doe',
  bio = 'Full-stack developer with a passion for creating beautiful and functional web applications. I write about technology, design, and my journey in the tech industry.',
  avatar,
  socialLinks = [
    { platform: 'Twitter', url: '#' },
    { platform: 'GitHub', url: '#' },
    { platform: 'LinkedIn', url: '#' },
  ]
}) => {
  return (
    <div className="author-bio-card">
      {/* Section Title */}
      <h2 className="author-bio-title">
        About Me
      </h2>

      {/* Avatar */}
      {avatar && (
        <div className="author-bio-avatar">
          {avatar}
        </div>
      )}

      {/* Author Name */}
      <h3 className="author-bio-name">
        {name}
      </h3>

      {/* Author Bio */}
      <p className="author-bio-text">
        {bio}
      </p>

      {/* Social Links */}
      {socialLinks && socialLinks.length > 0 && (
        <div className="author-bio-socials">
          {socialLinks.map((link, index) => (
            <Link
              key={index}
              href={link.url}
              className="author-bio-social-link"
            >
              {link.platform}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuthorBio;
