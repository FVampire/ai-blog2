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
      `SELECT key, value, type FROM settings WHERE key LIKE 'site_%' OR key LIKE 'about_%' OR key LIKE 'footer_%' ORDER BY key`
    );

    const settings: Record<string, unknown> = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = parseSettingValue(row.value, row.type);
    });

    return NextResponse.json({
      success: true,
      data: {
        siteName: settings.site_name || '五月的火',
        siteDescription: settings.site_description || 'A blog about technology, design, and development',
        footerText: settings.footer_text || `© ${new Date().getFullYear()} 五月的火. All rights reserved.`,
        socialLinks: settings.about_social_links || [],
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
