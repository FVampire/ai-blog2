import { NextResponse } from 'next/server';

import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT id, name, category, sort_order FROM skills ORDER BY sort_order, id`
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get skills error:', error);
    return NextResponse.json(
      { success: false, message: '获取技能列表失败' },
      { status: 500 }
    );
  }
}
