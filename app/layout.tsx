import type { Metadata } from 'next';

import '../styles/globals.css';
import '../styles/admin.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AI Blog',
  description: '基于 AI 的智能博客平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
