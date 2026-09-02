export interface CosConfig {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  publicBaseUrl: string;
  objectAcl: 'public-read' | '';
}

function trimEnv(name: string): string {
  return process.env[name]?.trim() || '';
}

export function getCosPublicBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = (env.COS_PUBLIC_BASE_URL || env.NEXT_PUBLIC_COS_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (explicit) return explicit;
  const bucket = env.COS_BUCKET?.trim() || '';
  const region = env.COS_REGION?.trim() || '';
  if (bucket && region) return `https://${bucket}.cos.${region}.myqcloud.com`;
  return '';
}

export function isCosConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.COS_SECRET_ID?.trim()
    && env.COS_SECRET_KEY?.trim()
    && env.COS_BUCKET?.trim()
    && env.COS_REGION?.trim(),
  );
}

export function getCosConfig(env: NodeJS.ProcessEnv = process.env): CosConfig | null {
  if (!isCosConfigured(env)) return null;
  const acl = (env.COS_OBJECT_ACL || 'public-read').trim().toLowerCase();
  return {
    secretId: trimEnv('COS_SECRET_ID'),
    secretKey: trimEnv('COS_SECRET_KEY'),
    bucket: trimEnv('COS_BUCKET'),
    region: trimEnv('COS_REGION'),
    publicBaseUrl: getCosPublicBaseUrl(env),
    objectAcl: acl === 'none' || acl === 'private' ? '' : 'public-read',
  };
}
