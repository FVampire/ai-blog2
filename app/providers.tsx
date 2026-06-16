'use client';

import { usePathname } from 'next/navigation';

import AIChatWidget from '../components/AIChatWidget';
import { ArticleProvider } from '../contexts/ArticleContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <ArticleProvider>
      {children}
      {!isAdminPage && <AIChatWidget />}
    </ArticleProvider>
  );
}
