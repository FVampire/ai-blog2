'use client';

import React, { useEffect, useState } from 'react';

const Footer: React.FC = () => {
  const [footerText, setFooterText] = useState(`© ${new Date().getFullYear()} 五月的火. All rights reserved.`);

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.footerText) {
          setFooterText(data.data.footerText);
        }
      })
      .catch(err => {
        console.error('Failed to fetch footer settings:', err);
      });
  }, []);

  return (
    <footer className="footer">
      <div className="footer-text">{footerText}</div>
    </footer>
  );
};

export default Footer;