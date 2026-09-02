// 与 /api/settings 的脱敏规则保持一致：非 admin 角色读到的敏感项 value 为 null
const SENSITIVE_KEY_PATTERNS = ['api_key', 'apikey', 'secret', 'token', 'password', 'webhook'];

export const MASKED_FIELD_PLACEHOLDER = '权限不足，无法查看（保存时保持不变）';

export function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => lowerKey.includes(pattern));
}

export function collectMaskedKeys(details: Record<string, { value: unknown }>): string[] {
  return Object.keys(details).filter((key) => isSensitiveKey(key) && details[key]?.value === null);
}
