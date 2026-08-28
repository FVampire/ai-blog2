import type { Metadata } from 'next';
import Link from 'next/link';

import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata: Metadata = {
  title: '页面未找到',
  description: '你访问的页面不存在或已被移除。',
};

export default function NotFound() {
  return (
    <div>
      <Header />

      <div className="container">
        <div className="card" style={{ marginTop: 40, padding: '48px 24px', textAlign: 'center' }}>
          <h1 className="section-title">404 · 页面未找到</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            你访问的内容不存在、已被删除，或者链接写错了。
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="projects-view-all">返回首页</Link>
            <Link href="/articles" className="projects-view-all">浏览全部文章</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
