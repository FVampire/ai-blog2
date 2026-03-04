import { query } from '../db';

interface Setting {
  id: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SettingsRepository {
  /**
   * 获取所有设置
   */
  static async getAllSettings(): Promise<Setting[]> {
    const result = await query(
      `
      SELECT
        id, key, value, type, description, created_at, updated_at
      FROM settings
      ORDER BY key ASC
      `
    );

    return result.rows.map(row => ({
      id: row.id,
      key: row.key,
      value: row.value,
      type: row.type,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * 通过key获取设置
   */
  static async getSettingByKey(key: string): Promise<Setting | null> {
    const result = await query(
      `
      SELECT
        id, key, value, type, description, created_at, updated_at
      FROM settings
      WHERE key = $1
      `,
      [key]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      type: row.type,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 通过多个keys获取设置
   */
  static async getSettingsByKeys(keys: string[]): Promise<Setting[]> {
    if (keys.length === 0) {
      return [];
    }

    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const queryText = `
      SELECT
        id, key, value, type, description, created_at, updated_at
      FROM settings
      WHERE key IN (${placeholders})
      ORDER BY key ASC
    `;

    const result = await query(queryText, keys);

    return result.rows.map(row => ({
      id: row.id,
      key: row.key,
      value: row.value,
      type: row.type,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * 创建或更新设置
   */
  static async upsertSetting(data: {
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
  }): Promise<Setting> {
    const result = await query(
      `
      INSERT INTO settings (key, value, type, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        type = EXCLUDED.type,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, key, value, type, description, created_at, updated_at
      `,
      [data.key, data.value, data.type, data.description || null]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      type: row.type,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 更新设置
   */
  static async updateSetting(key: string, data: {
    value?: string;
    type?: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
  }): Promise<Setting> {
    // 构建动态更新 SQL
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.value !== undefined) {
      updateFields.push(`value = $${paramIndex}`);
      updateValues.push(data.value);
      paramIndex++;
    }

    if (data.type !== undefined) {
      updateFields.push(`type = $${paramIndex}`);
      updateValues.push(data.type);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(data.description);
      paramIndex++;
    }

    // 如果没有任何字段需要更新
    if (updateFields.length === 0) {
      // 获取当前设置信息
      const currentSetting = await this.getSettingByKey(key);
      if (!currentSetting) {
        throw new Error('设置不存在');
      }
      return currentSetting;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(key); // 最后一个参数是 key

    const updateQuery = `
      UPDATE settings
      SET ${updateFields.join(', ')}
      WHERE key = $${paramIndex}
      RETURNING id, key, value, type, description, created_at, updated_at
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      throw new Error('设置不存在');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      type: row.type,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 删除设置
   */
  static async deleteSetting(key: string): Promise<boolean> {
    const result = await query('DELETE FROM settings WHERE key = $1', [key]);
    return result.rowCount > 0;
  }

  /**
   * 获取站点基本信息设置
   */
  static async getSiteSettings(): Promise<{
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    adminEmail: string;
    postsPerPage: number;
  }> {
    const keys = ['site_name', 'site_description', 'site_url', 'admin_email', 'posts_per_page'];
    const settings = await this.getSettingsByKeys(keys);

    // 将设置转换为键值对对象
    const settingsMap: { [key: string]: string } = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    return {
      siteName: settingsMap['site_name'] || '默认站点名称',
      siteDescription: settingsMap['site_description'] || '默认站点描述',
      siteUrl: settingsMap['site_url'] || '',
      adminEmail: settingsMap['admin_email'] || '',
      postsPerPage: parseInt(settingsMap['posts_per_page']) || 10,
    };
  }

  /**
   * 更新站点基本信息设置
   */
  static async updateSiteSettings(data: {
    siteName?: string;
    siteDescription?: string;
    siteUrl?: string;
    adminEmail?: string;
    postsPerPage?: number;
  }): Promise<void> {
    const updates: Promise<Setting>[] = [];

    if (data.siteName !== undefined) {
      updates.push(this.upsertSetting({
        key: 'site_name',
        value: data.siteName,
        type: 'string',
        description: '站点名称'
      }));
    }

    if (data.siteDescription !== undefined) {
      updates.push(this.upsertSetting({
        key: 'site_description',
        value: data.siteDescription,
        type: 'string',
        description: '站点描述'
      }));
    }

    if (data.siteUrl !== undefined) {
      updates.push(this.upsertSetting({
        key: 'site_url',
        value: data.siteUrl,
        type: 'string',
        description: '站点URL'
      }));
    }

    if (data.adminEmail !== undefined) {
      updates.push(this.upsertSetting({
        key: 'admin_email',
        value: data.adminEmail,
        type: 'string',
        description: '管理员邮箱'
      }));
    }

    if (data.postsPerPage !== undefined) {
      updates.push(this.upsertSetting({
        key: 'posts_per_page',
        value: data.postsPerPage.toString(),
        type: 'number',
        description: '每页文章数'
      }));
    }

    // 并行执行所有更新
    await Promise.all(updates);
  }

  /**
   * 获取所有设置并转换为键值对对象
   */
  static async getAllSettingsAsObject(): Promise<{ [key: string]: any }> {
    const settings = await this.getAllSettings();
    const settingsObject: { [key: string]: any } = {};

    settings.forEach(setting => {
      switch (setting.type) {
        case 'number':
          settingsObject[setting.key] = Number(setting.value);
          break;
        case 'boolean':
          settingsObject[setting.key] = setting.value.toLowerCase() === 'true';
          break;
        case 'json':
          try {
            settingsObject[setting.key] = JSON.parse(setting.value);
          } catch (e) {
            settingsObject[setting.key] = setting.value;
          }
          break;
        default:
          settingsObject[setting.key] = setting.value;
      }
    });

    return settingsObject;
  }

  /**
   * 根据类型获取设置值
   */
  static async getSettingValue(key: string, defaultValue: any = null): Promise<any> {
    const setting = await this.getSettingByKey(key);

    if (!setting) {
      return defaultValue;
    }

    switch (setting.type) {
      case 'number':
        return Number(setting.value);
      case 'boolean':
        return setting.value.toLowerCase() === 'true';
      case 'json':
        try {
          return JSON.parse(setting.value);
        } catch (e) {
          return defaultValue;
        }
      default:
        return setting.value;
    }
  }
}