export interface PublicSettings {
  siteName?: string;
  siteDescription?: string;
  footerText?: string;
  socialLinks?: Array<{ platform?: string; name?: string; url?: string }>;
  projectsEnabled?: boolean;
  projectsNavLabel?: string;
}

const CACHE_TTL_MS = 5 * 60_000;
let cached: { value: PublicSettings; expiresAt: number } | null = null;
let pending: Promise<PublicSettings> | null = null;

export function getPublicSettings(): Promise<PublicSettings> {
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
  if (pending) return pending;

  pending = fetch('/api/settings/public')
    .then(async (response) => {
      if (!response.ok) throw new Error(`Public settings request failed: ${response.status}`);
      const body = await response.json();
      if (!body.success || !body.data) throw new Error('Public settings response is invalid');
      cached = { value: body.data, expiresAt: Date.now() + CACHE_TTL_MS };
      return cached.value;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
