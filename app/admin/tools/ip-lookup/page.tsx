import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminPage } from '@/lib/auth-page';

import IpLookupTool from './IpLookupTool';

export const metadata: Metadata = {
  title: 'IP 城市查询 - Blog Admin',
  robots: { index: false, follow: false },
};

export default async function AdminIpLookupPage() {
  const user = await requireAdminPage();
  if (user.role !== 'admin') redirect('/admin');

  return (
    <AdminLayout>
      <IpLookupTool />
    </AdminLayout>
  );
}
