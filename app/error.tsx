'use client';

import { useEffect } from 'react';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 40, padding: '48px 24px', textAlign: 'center' }}>
        <h1 className="section-title">页面出错了</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          加载这个页面时发生了意外错误，可能是网络或服务暂时不可用。
        </p>
        {error.digest && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 24 }}>
            错误编号：{error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => reset()}
            style={{ padding: '10px 22px', width: 'auto' }}
          >
            重试
          </button>
          <Link href="/" className="projects-view-all">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
