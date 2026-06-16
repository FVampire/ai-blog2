import { NextRequest, NextResponse } from 'next/server';

import { needsModeration, getFilterReason } from '@/lib/content-filter';
import { query } from '@/lib/db';

// GET - Get approved comments for a post (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await query(
      `SELECT id, visitor_id, content, created_at
       FROM comments
       WHERE post_id = $1 AND status = 'approved'
       ORDER BY created_at DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST - Submit a new comment (public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { visitorId, content } = await request.json();

    if (!visitorId || !content) {
      return NextResponse.json(
        { success: false, message: '访客ID和评论内容不能为空' },
        { status: 400 }
      );
    }

    if (content.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: '评论内容至少需要2个字符' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, message: '评论内容不能超过1000个字符' },
        { status: 400 }
      );
    }

    const needsReview = needsModeration(content);
    const status = needsReview ? 'pending' : 'approved';

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const ipAddress = forwarded
      ? forwarded.split(',')[0]
      : 'unknown';

    let city = '';
    if (ipAddress && ipAddress !== 'unknown') {
      try {
        const result = await fetch(
          `http://ip-api.com/json/${ipAddress}?lang=zh-CN`
        );
        if (result.ok) {
          const data = await result.json();
          city = data.city || '';
        }
      } catch {}
    }

    const result = await query(
      `INSERT INTO comments (post_id, visitor_id, ip_address, city, content, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, visitor_id, content, city, status, created_at`,
      [id, visitorId, ipAddress, city, content.trim(), status]
    );

    if (needsReview) {
      const reason = getFilterReason(content);
      console.log(`Comment ${result.rows[0].id} flagged for review: ${reason}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: needsReview
          ? '评论提交成功，包含敏感内容，等待审核'
          : '评论提交成功',
        data: result.rows[0],
        needsReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
