import { redirect } from 'next/navigation';

import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminPage } from '@/lib/auth-page';

import TranslationTool from './TranslationTool';

export const metadata = {
  title: '多源文本翻译 - Blog Admin',
  robots: { index: false, follow: false },
};

export default async function AdminTranslationPage() {
  const user = await requireAdminPage();
  if (user.role !== 'admin') redirect('/admin');

  return (
    <AdminLayout>
      <TranslationTool />
    </AdminLayout>
  );
}
