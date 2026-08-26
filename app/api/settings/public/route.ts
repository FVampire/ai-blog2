import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    const result = await query(
      `SELECT key, value, type FROM settings
       WHERE key LIKE 'site_%' OR key LIKE 'about_%' OR key LIKE 'footer_%' OR key LIKE 'projects_%'
       ORDER BY key`
    );

    const settings: Record<string, unknown> = {};
    result.rows.forEach((row: { key: string; value: string; type: string }) => {
      settings[row.key] = parseSettingValue(row.value, row.type);
    });

    return NextResponse.json({
      success: true,
      data: {
        siteName: settings.site_name || '五月的火',
        siteDescription: settings.site_description || 'A blog about technology, design, and development',
        footerText: settings.footer_text || `© ${new Date().getFullYear()} 五月的火. All rights reserved.`,
        socialLinks: settings.about_social_links || [],
        projectsEnabled: settings.projects_enabled !== false,
        projectsNavLabel: settings.projects_nav_label || 'Projects',
        projectsIntro: settings.projects_intro || '我的项目与开发成果',
        projectsShowOnHome: settings.projects_show_on_home !== false,
        projectsHomeCount: settings.projects_home_count || 3,
      },
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          siteName: '五月的火',
          siteDescription: 'A blog about technology, design, and development',
          footerText: `© ${new Date().getFullYear()} 五月的火. All rights reserved.`,
          socialLinks: [],
        },
      }
    );
  }
}
