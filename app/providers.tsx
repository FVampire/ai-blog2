'use client';

import { usePathname } from 'next/navigation';

import AIChatWidget from '../components/AIChatWidget';
import { ArticleProvider } from '../contexts/ArticleContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <ThemeProvider>
      <ArticleProvider>
        {children}
        {!isAdminPage && <AIChatWidget />}
      </ArticleProvider>
    </ThemeProvider>
  );
}
