'use client';

import { usePathname } from 'next/navigation';

import AIChatWidget from '../components/AIChatWidget';
import { ArticleProvider } from '../contexts/ArticleContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChat = pathname.startsWith('/admin') || pathname.startsWith('/design-preview');

  return (
    <ThemeProvider>
      <ArticleProvider>
        {children}
        {!hideChat && <AIChatWidget />}
      </ArticleProvider>
    </ThemeProvider>
  );
}
