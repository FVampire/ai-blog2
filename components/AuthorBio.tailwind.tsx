'use client';

import React from 'react';

import Image from 'next/image';

interface AuthorSocialLink {
  platform?: string;
  name?: string;
  url?: string;
}

interface AuthorBioProps {
  name?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: AuthorSocialLink[];
}

const AuthorBio: React.FC<AuthorBioProps> = ({
  name = '博主',
  bio = '记录技术、设计与开发路上的思考和实践。',
  avatar,
  socialLinks = [],
}) => {
  const visibleLinks = socialLinks.filter(
    (link) => typeof link.url === 'string' && link.url.trim() !== '' && link.url !== '#'
  );
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className="author-bio-card">
      <h2 className="author-bio-title">关于我</h2>

      <div className={`author-bio-avatar ${avatar ? 'author-bio-avatar-circle' : ''}`}>
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            width={80}
            height={80}
            className="author-bio-avatar-img"
          />
        ) : (
          <span className="author-bio-avatar-initial">{initial}</span>
        )}
      </div>

      <h3 className="author-bio-name">{name}</h3>

      <p className="author-bio-text">{bio}</p>

      {visibleLinks.length > 0 && (
        <div className="author-bio-socials">
          {visibleLinks.map((link, index) => (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              className="author-bio-social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.name || link.platform || link.url}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuthorBio;
