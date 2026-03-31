import { NextApiRequest, NextApiResponse } from 'next';
import { createDatabaseAdapter } from '../../../lib/db-adapter';

// 获取 AI 公开配置（不包含敏感信息）
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    // 为 Supabase 模式创建数据库适配器
    const dbAdapter = createDatabaseAdapter(req, res);

    // 获取客户端，其中包含 Supabase 客户端实例
    const client = await dbAdapter.getClient();

    // 检查是否是 Supabase 适配器
    const supabase = (client as any).supabase;

    let settings: Record<string, any> = {};
    let hasApiKey = false;

    if (supabase) {
      // Supabase 模式：使用 Supabase 客户端查询
      const { data, error } = await supabase
        .from('settings')
        .select('key, value, type')
        .or('key.like.ai_*,key.like.mcp_*');

      if (error) {
        // Handle the case where the settings table doesn't exist
        if (error.message.includes('not find the table') || error.message.includes('does not exist')) {
          console.warn('Settings table not found in database. Returning default configuration.');
          return res.status(200).json({
            success: true,
            data: {
              ai_enabled: false,
              ai_provider: 'openai',
              ai_model: 'gpt-3.5-turbo',
              ai_model_light: '',
              ai_embedding_model: '',
              ai_assistant_enabled: false,
              ai_summary_enabled: false,
              ai_search_enabled: false,
              ai_available: false,
              mcp_enabled: false,
              mcp_allow_user_select: true
            },
          });
        }
        throw new Error(error.message);
      }

      data.forEach((row: any) => {
        // 排除敏感信息 - 这些字段只在后端使用，不返回给前端
        const sensitiveKeys = ['ai_api_key', 'ai_api_base_url', 'ai_assistant_system_prompt'];
        if (sensitiveKeys.includes(row.key)) {
          if (row.key === 'ai_api_key') {
            hasApiKey = !!row.value;
          }
          return;
        }

        let value = row.value;
        if (row.type === 'boolean') {
          value = row.value === 'true';
        }
        settings[row.key] = value;
      });
    } else {
      // PostgreSQL/MySQL/SQLite 模式：使用标准 SQL 查询
      try {
        const { rows } = await client.query(
          "SELECT key, value, type FROM settings WHERE key LIKE 'ai_%' OR key LIKE 'mcp_%'"
        );
        rows.forEach((row: any) => {
          // 排除敏感信息 - 这些字段只在后端使用，不返回给前端
          const sensitiveKeys = ['ai_api_key', 'ai_api_base_url', 'ai_assistant_system_prompt'];
          if (sensitiveKeys.includes(row.key)) {
            if (row.key === 'ai_api_key') {
              hasApiKey = !!row.value;
            }
            return;
          }

          let value = row.value;
          if (row.type === 'boolean') {
            value = row.value === 'true';
          }
          settings[row.key] = value;
        });
      } catch (sqlError: any) {
        // Handle the case where the settings table doesn't exist
        if (sqlError.message?.includes('does not exist') ||
            sqlError.message?.includes("doesn't exist") ||
            sqlError.code === '42P01' || // PostgreSQL: table does not exist
            sqlError.code === 'ER_NO_SUCH_TABLE' || // MySQL: table doesn't exist
            sqlError.code === 'SQLITE_ERROR') { // SQLite error
          console.warn('Settings table not found in database. Returning default configuration.');
          return res.status(200).json({
            success: true,
            data: {
              ai_enabled: false,
              ai_provider: 'openai',
              ai_model: 'gpt-3.5-turbo',
              ai_model_light: '',
              ai_embedding_model: '',
              ai_assistant_enabled: false,
              ai_summary_enabled: false,
              ai_search_enabled: false,
              ai_available: false,
              mcp_enabled: false,
              mcp_allow_user_select: true
            },
          });
        }
        throw sqlError;
      }
    }

    // 检查 AI 是否可用（启用且有 API Key）
    settings.ai_available = settings.ai_enabled && hasApiKey;

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Get AI config error:', error);
    return res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message
    });
  }
}