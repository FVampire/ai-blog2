import { NextApiResponse } from 'next';
import { requireRole, authMiddleware, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { query } from '../../../lib/db';

// 解析设置值
function parseSettingValue(value: string | null, type: string): any {
  if (value === null) return null;

  switch (type) {
    case 'number':
      return parseInt(value, 10);
    case 'boolean':
      return value === 'true';
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

// 序列化设置值
function serializeSettingValue(value: any, type: string): string {
  switch (type) {
    case 'number':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'json':
      return JSON.stringify(value);
    default:
      return String(value);
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 获取所有设置
    try {
      const result = await query(
        'SELECT key, value, type, description FROM settings ORDER BY key'
      );

      // 将设置转换为对象格式
      const settings: Record<string, any> = {};
      const settingsDetails: Record<string, { value: any; type: string; description: string }> = {};

      result.rows.forEach(row => {
        settings[row.key] = parseSettingValue(row.value, row.type);
        settingsDetails[row.key] = {
          value: parseSettingValue(row.value, row.type),
          type: row.type,
          description: row.description,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          settings,
          details: settingsDetails,
        },
      });
    } catch (error) {
      console.error('Get settings error:', error);
      return res.status(500).json({
        success: false,
        message: '获取设置失败',
      });
    }
  }

  if (req.method === 'PUT') {
    // 更新设置（需要管理员权限）
    try {
      const { settings } = req.body;

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          message: '无效的设置数据',
        });
      }

      // 获取现有设置的类型信息
      const existingSettings = await query('SELECT key, type FROM settings');
      const typeMap: Record<string, string> = {};
      existingSettings.rows.forEach(row => {
        typeMap[row.key] = row.type;
      });

      // 批量更新设置
      const updates = Object.entries(settings);
      for (const [key, value] of updates) {
        const type = typeMap[key] || 'string';
        const serializedValue = serializeSettingValue(value, type);

        await query(
          'UPDATE settings SET value = $1 WHERE key = $2',
          [serializedValue, key]
        );
      }

      return res.status(200).json({
        success: true,
        message: '设置已更新',
      });
    } catch (error) {
      console.error('Update settings error:', error);
      return res.status(500).json({
        success: false,
        message: '更新设置失败',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: '方法不允许',
  });
}

// GET 需要认证，PUT 需要管理员权限
export default async function (req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // GET 请求只需要认证
    return authMiddleware(handler)(req, res);
  } else {
    // 其他请求需要管理员权限
    return requireRole(['admin'])(handler)(req, res);
  }
}
