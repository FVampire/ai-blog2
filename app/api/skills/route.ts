import { NextResponse } from 'next/server';

import { getSkills } from '@/lib/skills';

export async function GET() {
  try {
    const data = await getSkills();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get skills error:', error);
    return NextResponse.json(
      { success: false, message: '获取技能列表失败' },
      { status: 500 }
    );
  }
}
