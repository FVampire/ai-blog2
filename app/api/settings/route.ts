import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, requireRoles, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';

function parseSettingValue(value: string | null, type: string): unknown {
  if (value === null) return null;
  switch (type) {
    case 'number': return parseInt(value, 10);
    case 'boolean': return value === 'true';
    case 'json':
      try { return JSON.parse(value); } catch { return value; }
    default: return value;
  }
}

function serializeSettingValue(value: unknown, type: string): string {
  switch (type) {
    case 'number': return String(value);
    case 'boolean': return value ? 'true' : 'false';
    case 'json': return JSON.stringify(value);
    default: return String(value);
  }
}

const SENSITIVE_SETTING_KEYS = ['ai_api_key', 'ai_embedding_api_key'];
const SENSITIVE_KEY_PATTERNS = ['api_key', 'apikey', 'secret', 'token', 'password'];

function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return (
    SENSITIVE_SETTING_KEYS.includes(lowerKey) ||
    SENSITIVE_KEY_PATTERNS.some((pattern) => lowerKey.includes(pattern))
  );
}

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const canReadSecrets = authResult.user.role === 'admin';

  try {
    const result = await query(
      'SELECT key, value, type, description FROM settings ORDER BY key'
    );

    const settings: Record<string, unknown> = {};
    const settingsDetails: Record<string, { value: unknown; type: string; description: string }> = {};

    result.rows.forEach((row: any) => {
      const masked = !canReadSecrets && isSensitiveKey(row.key);
      const value = masked ? null : parseSettingValue(row.value, row.type);
      settings[row.key] = value;
      settingsDetails[row.key] = {
        value,
        type: row.type,
        description: row.description,
      };
    });

    return NextResponse.json({
      success: true,
      data: { settings, details: settingsDetails },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, message: '获取设置失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, message: '无效的设置数据' },
        { status: 400 }
      );
    }

    const existingSettings = await query('SELECT key, type FROM settings');
    const typeMap: Record<string, string> = {};
    existingSettings.rows.forEach((row: any) => {
      typeMap[row.key] = row.type;
    });

    const updatedKeys: string[] = [];
    const ignoredKeys: string[] = [];

    const updates = Object.entries(settings);
    for (const [key, value] of updates) {
      const type = typeMap[key];
      if (!type) {
        ignoredKeys.push(key);
        continue;
      }

      const serializedValue = serializeSettingValue(value, type);
      await query(
        'UPDATE settings SET value = $1 WHERE key = $2',
        [serializedValue, key]
      );
      updatedKeys.push(key);
    }

    return NextResponse.json({
      success: true,
      message: ignoredKeys.length > 0
        ? `设置已更新，已忽略未知配置项：${ignoredKeys.join('、')}`
        : '设置已更新',
      data: { updatedKeys, ignoredKeys },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, message: '更新设置失败' },
      { status: 500 }
    );
  }
}
