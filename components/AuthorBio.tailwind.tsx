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
    <div className="
      bg-gradient-to-br from-[#FFF5F0] to-[#FFE8DD]
      rounded-[20px]
      border-2 border-warm-orange/20
      p-9
      shadow-[0_4px_20px_rgba(255,140,66,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]
      flex flex-col gap-4
    ">
      {/* Section Title */}
      <h2 className="
        font-display italic text-xl font-normal
        bg-gradient-to-r from-warm-coral to-warm-orange
        bg-clip-text text-transparent
        mb-6
      ">
        About Me
      </h2>

      {/* Avatar */}
      {avatar && (
        <div className="
          w-20 h-20
          bg-gradient-to-br from-[#FFE5D9] to-[#FFD4C4]
          rounded-[20px]
          flex items-center justify-center
          border-3 border-warm-orange/30
          shadow-[0_4px_20px_rgba(255,140,66,0.2)]
          transition-all duration-300
          hover:border-warm-orange
          hover:shadow-[0_8px_30px_rgba(255,140,66,0.4)]
          hover:scale-105 hover:rotate-[5deg]
        ">
          {avatar}
        </div>
      )}

      {/* Author Name */}
      <h3 className="
        font-display italic text-2xl font-normal
        bg-gradient-to-r from-warm-coral to-warm-orange
        bg-clip-text text-transparent
      ">
        {name}
      </h3>

      {/* Author Bio */}
      <p className="
        font-body text-base font-normal
        text-[#8B6B5C]
        leading-relaxed
      ">
        {bio}
      </p>

      {/* Social Links */}
      {socialLinks && socialLinks.length > 0 && (
        <div className="flex gap-6">
          {socialLinks.map((link, index) => (
            <Link
              key={index}
              href={link.url}
              className="
                font-body text-base font-normal
                text-warm-orange
                transition-all duration-300
                hover:text-warm-coral
                hover:-translate-y-0.5
              "
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
