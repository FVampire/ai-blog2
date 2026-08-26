'use client';

import React, { useEffect, useState } from 'react';

const DEFAULT_FOOTER = `© ${new Date().getFullYear()} 五月的火. All rights reserved.`;

const Footer: React.FC = () => {
  const [footerText, setFooterText] = useState(DEFAULT_FOOTER);

  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.footerText) {
          setFooterText(data.data.footerText);
        }
      })
      .catch(() => {
        setFooterText(DEFAULT_FOOTER);
      });
  }, []);

  return (
    <footer className="footer">
      <div className="footer-text">{footerText}</div>
    </footer>
  );
};

export default Footer;