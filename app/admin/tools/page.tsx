import Link from 'next/link';
import { redirect } from 'next/navigation';

import AdminIcon from '@/components/admin/AdminIcon';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminPage } from '@/lib/auth-page';

import styles from './tools.module.css';

export const metadata = {
  title: '管理员工具 - Blog Admin',
  robots: { index: false, follow: false },
};

export default async function AdminToolsPage() {
  const user = await requireAdminPage();
  if (user.role !== 'admin') redirect('/admin');

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className="page-header">
          <div>
            <p className="page-eyebrow">系统能力</p>
            <h1 className="page-title">管理员工具</h1>
            <p className="page-description">仅管理员可访问的外部 API 调试与日常运营工具。</p>
          </div>
        </div>
        <div className={styles.grid}>
          <Link className={styles.card} href="/admin/tools/translate">
            <span className={styles.icon}><AdminIcon name="tools" size={22} /></span>
            <div>
              <h2>多源文本翻译</h2>
              <p>腾讯混元、阿里云、百度翻译单源调用或并行对比。</p>
              <small>3 个数据源</small>
            </div>
            <span className={styles.arrow}>→</span>
          </Link>
          <Link className={styles.card} href="/admin/tools/ip-lookup">
            <span className={styles.icon}><AdminIcon name="tools" size={22} /></span>
            <div>
              <h2>IP 城市查询</h2>
              <p>对照 ipwho.is 与高德 IP 定位结果。</p>
              <small>2 个数据源</small>
            </div>
            <span className={styles.arrow}>→</span>
          </Link>
          <Link className={styles.card} href="/admin/tools/gemini">
            <span className={styles.icon}><AdminIcon name="tools" size={22} /></span>
            <div>
              <h2>Gemini API 调用台</h2>
              <p>验证 Gemini 模型配置、提示词与 Token 用量。</p>
              <small>需要 GEMINI_API_KEY</small>
            </div>
            <span className={styles.arrow}>→</span>
          </Link>
          <Link className={styles.card} href="/admin/tools/currency">
            <span className={styles.icon}><AdminIcon name="tools" size={22} /></span>
            <div>
              <h2>Frankfurter 汇率查询</h2>
              <p>查询最新或历史参考汇率并完成金额换算。</p>
              <small>免 API Key</small>
            </div>
            <span className={styles.arrow}>→</span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
