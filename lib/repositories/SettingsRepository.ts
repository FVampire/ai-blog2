import { BaseRepository } from './BaseRepository';
import { Setting } from '../entities/Setting';
import { In } from 'typeorm';

interface SettingDTO {
  id: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

function toDTO(s: Setting): SettingDTO {
  return {
    id: s.id,
    key: s.key,
    value: s.value ?? '',
    type: s.type,
    description: s.description,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export class SettingsRepository extends BaseRepository {
  /**
   * 获取所有设置
   */
  static async getAllSettings(): Promise<SettingDTO[]> {
    const repo = await this.getRepo(Setting);
    const settings = await repo.find({ order: { key: 'ASC' } });
    return settings.map(toDTO);
  }

  /**
   * 通过key获取设置
   */
  static async getSettingByKey(key: string): Promise<SettingDTO | null> {
    const repo = await this.getRepo(Setting);
    const setting = await repo.findOne({ where: { key } });
    return setting ? toDTO(setting) : null;
  }

  /**
   * 通过多个keys获取设置
   */
  static async getSettingsByKeys(keys: string[]): Promise<SettingDTO[]> {
    if (keys.length === 0) return [];
    const repo = await this.getRepo(Setting);
    const settings = await repo.find({
      where: { key: In(keys) },
      order: { key: 'ASC' },
    });
    return settings.map(toDTO);
  }

  /**
   * 创建或更新设置
   */
  static async upsertSetting(data: {
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
  }): Promise<SettingDTO> {
    const ds = await this.getDataSource();
    const result = await ds.query(
      `INSERT INTO settings (key, value, type, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, type = EXCLUDED.type,
         description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP
       RETURNING id, key, value, type, description, created_at, updated_at`,
      [data.key, data.value, data.type, data.description || null],
    );

    const row = result[0];
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
  static async updateSetting(
    key: string,
    data: {
      value?: string;
      type?: 'string' | 'number' | 'boolean' | 'json';
      description?: string;
    },
  ): Promise<SettingDTO> {
    const repo = await this.getRepo(Setting);
    const setting = await repo.findOne({ where: { key } });
    if (!setting) {
      throw new Error('设置不存在');
    }

    if (data.value !== undefined) setting.value = data.value;
    if (data.type !== undefined) setting.type = data.type;
    if (data.description !== undefined) setting.description = data.description;

    const saved = await repo.save(setting) as Setting;
    return toDTO(saved);
  }

  /**
   * 删除设置
   */
  static async deleteSetting(key: string): Promise<boolean> {
    const repo = await this.getRepo(Setting);
    const result = await repo.delete({ key });
    return (result.affected ?? 0) > 0;
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

    const settingsMap: { [key: string]: string } = {};
    settings.forEach((setting) => {
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
    const updates: Promise<SettingDTO>[] = [];

    if (data.siteName !== undefined) {
      updates.push(this.upsertSetting({ key: 'site_name', value: data.siteName, type: 'string', description: '站点名称' }));
    }
    if (data.siteDescription !== undefined) {
      updates.push(this.upsertSetting({ key: 'site_description', value: data.siteDescription, type: 'string', description: '站点描述' }));
    }
    if (data.siteUrl !== undefined) {
      updates.push(this.upsertSetting({ key: 'site_url', value: data.siteUrl, type: 'string', description: '站点URL' }));
    }
    if (data.adminEmail !== undefined) {
      updates.push(this.upsertSetting({ key: 'admin_email', value: data.adminEmail, type: 'string', description: '管理员邮箱' }));
    }
    if (data.postsPerPage !== undefined) {
      updates.push(this.upsertSetting({ key: 'posts_per_page', value: data.postsPerPage.toString(), type: 'number', description: '每页文章数' }));
    }

    await Promise.all(updates);
  }

  /**
   * 获取所有设置并转换为键值对对象
   */
  static async getAllSettingsAsObject(): Promise<{ [key: string]: any }> {
    const settings = await this.getAllSettings();
    const settingsObject: { [key: string]: any } = {};

    settings.forEach((setting) => {
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
   * 获取 AI 设置
   */
  static async getAISettings() {
    const repo = await this.getRepo(Setting);
    const qb = repo.createQueryBuilder('s')
      .where('s.key LIKE :prefix', { prefix: 'ai_%' });
    const settings = await qb.getMany();

    const result: Record<string, any> = {};
    settings.forEach((s) => {
      let value: any = s.value;
      if (s.type === 'boolean') {
        value = s.value === 'true';
      }
      if (s.type === 'number') {
        value = Number(s.value);
      }
      result[s.key] = value;
    });

    return result;
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

  /**
   * 获取关于页面设置
   */
  static async getAboutSettings(): Promise<{
    authorName: string;
    authorBio: string;
    authorBio2: string;
    authorBio3: string;
    socialLinks: Array<{ platform: string; name: string; url: string }>;
  }> {
    const keys = [
      'about_author_name', 'about_author_bio', 'about_author_bio_2',
      'about_author_bio_3', 'about_social_links',
    ];
    const settings = await this.getSettingsByKeys(keys);

    const settingsMap: { [key: string]: string } = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    let socialLinks: Array<{ platform: string; name: string; url: string }> = [];
    try {
      const socialLinksJson = settingsMap['about_social_links'];
      if (socialLinksJson) {
        const parsed = JSON.parse(socialLinksJson);
        if (Array.isArray(parsed)) {
          socialLinks = parsed.filter(
            (link): link is { platform: string; name: string; url: string } =>
              link &&
              typeof link.platform === 'string' &&
              typeof link.name === 'string' &&
              typeof link.url === 'string' &&
              link.url.trim() !== '',
          );
        }
      }
    } catch (e) {
      console.error('Failed to parse social links:', e);
    }

    return {
      authorName: settingsMap['about_author_name'] || 'John Doe',
      authorBio: settingsMap['about_author_bio'] || '',
      authorBio2: settingsMap['about_author_bio_2'] || '',
      authorBio3: settingsMap['about_author_bio_3'] || '',
      socialLinks,
    };
  }

  /**
   * 更新关于页面设置
   */
  static async updateAboutSettings(data: {
    authorName?: string;
    authorBio?: string;
    authorBio2?: string;
    authorBio3?: string;
    socialLinks?: Array<{ platform: string; name: string; url: string }>;
  }): Promise<void> {
    const updates: Promise<SettingDTO>[] = [];

    if (data.authorName !== undefined) {
      updates.push(this.upsertSetting({ key: 'about_author_name', value: data.authorName, type: 'string', description: '作者名称' }));
    }
    if (data.authorBio !== undefined) {
      updates.push(this.upsertSetting({ key: 'about_author_bio', value: data.authorBio, type: 'string', description: '作者简介（第一段）' }));
    }
    if (data.authorBio2 !== undefined) {
      updates.push(this.upsertSetting({ key: 'about_author_bio_2', value: data.authorBio2, type: 'string', description: '作者简介（第二段）' }));
    }
    if (data.authorBio3 !== undefined) {
      updates.push(this.upsertSetting({ key: 'about_author_bio_3', value: data.authorBio3, type: 'string', description: '作者简介（第三段）' }));
    }
    if (data.socialLinks !== undefined) {
      updates.push(this.upsertSetting({ key: 'about_social_links', value: JSON.stringify(data.socialLinks), type: 'json', description: '社交链接列表' }));
    }

    await Promise.all(updates);
  }

  /**
   * 获取项目展示设置
   */
  static async getProjectDisplaySettings(): Promise<{
    enabled: boolean;
    showOnHome: boolean;
    homeCount: number;
    intro: string;
    navLabel: string;
  }> {
    const keys = ['projects_enabled', 'projects_show_on_home', 'projects_home_count', 'projects_intro', 'projects_nav_label'];
    const settings = await this.getSettingsByKeys(keys);
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });

    return {
      enabled: map['projects_enabled'] !== 'false',
      showOnHome: map['projects_show_on_home'] !== 'false',
      homeCount: parseInt(map['projects_home_count']) || 3,
      intro: map['projects_intro'] || '我的项目与开发成果',
      navLabel: map['projects_nav_label'] || 'Projects',
    };
  }
}
