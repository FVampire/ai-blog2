export const ADMIN_TOKEN_COOKIE = 'admin_token';

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SEVEN_DAYS_SECONDS,
  };
}

export function expiredAdminCookieOptions() {
  return {
    ...adminCookieOptions(),
    maxAge: 0,
  };
}
