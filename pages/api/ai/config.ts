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

    // 获取 Supabase 客户端实例
    const supabase = (client as any).supabase;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Supabase client not available'
      });
    }

    // 使用 Supabase 客户端查询数据
    const { data, error } = await supabase
      .from('settings')
      .select('key, value, type')
      .like('key', 'ai_%');

    if (error) {
      // Handle the case where the settings table doesn't exist
      if (error.message.includes('not find the table') || error.message.includes('does not exist')) {
        console.warn('Settings table not found in database. Returning default configuration.');
        // Return default configuration when settings table doesn't exist
        return res.status(200).json({
          success: true,
          data: {
            ai_enabled: false,
            ai_provider: 'openai',
            ai_model: 'gpt-3.5-turbo',
            ai_assistant_enabled: false,
            ai_summary_enabled: false,
            ai_search_enabled: false,
            ai_available: false
          },
        });
      }

      // For other errors, return the error message
      throw new Error(error.message);
    }

    const settings: Record<string, any> = {};
    data.forEach((row: any) => {
      // 排除敏感信息
      if (row.key === 'ai_api_key') return;

      let value = row.value;
      if (row.type === 'boolean') {
        value = row.value === 'true';
      }
      settings[row.key] = value;
    });

    // 检查 AI 是否可用（启用且有 API Key）
    const hasApiKey = data.find((r: any) => r.key === 'ai_api_key')?.value;
    settings.ai_available = settings.ai_enabled && !!hasApiKey;

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