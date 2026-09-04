import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminPage } from '@/lib/auth-page';

import GeminiTool from './GeminiTool';

export const metadata: Metadata = {
  title: 'Gemini API 调用台 - Blog Admin',
  robots: { index: false, follow: false },
};

export default async function AdminGeminiPage() {
  const user = await requireAdminPage();
  if (user.role !== 'admin') redirect('/admin');

  return (
    <AdminLayout>
      <GeminiTool />
    </AdminLayout>
  );
}
