import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ADMIN_TOKEN_COOKIE } from './auth-cookie';
import { JWTPayload, verifyToken } from './jwt';

export async function requireAdminPage(): Promise<JWTPayload> {
  const token = (await cookies()).get(ADMIN_TOKEN_COOKIE)?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) {
    redirect('/admin/login');
  }
  return user;
}
