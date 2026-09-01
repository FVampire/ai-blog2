import type { Metadata } from 'next';
import { Noto_Serif_SC } from 'next/font/google';

const notoSerif = Noto_Serif_SC({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '博客设计预览',
  description: '博客前端设计稿，全部 mock 数据。',
  robots: { index: false, follow: false },
};

export default function DesignPreviewLayout({ children }: { children: React.ReactNode }) {
  return <div className={notoSerif.className}>{children}</div>;
}
