import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminPage } from '@/lib/auth-page';

import CurrencyTool from './CurrencyTool';

export const metadata: Metadata = {
  title: 'Frankfurter 汇率查询 - Blog Admin',
  robots: { index: false, follow: false },
};

export default async function AdminCurrencyPage() {
  const user = await requireAdminPage();
  if (user.role !== 'admin') redirect('/admin');

  return (
    <AdminLayout>
      <CurrencyTool />
    </AdminLayout>
  );
}
