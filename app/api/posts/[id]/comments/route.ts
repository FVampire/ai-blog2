import { NextRequest, NextResponse } from 'next/server';

import { needsModeration, getFilterReason } from '@/lib/content-filter';
import { query } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (Number.isNaN(postId)) {
    return NextResponse.json({ success: false, message: '无效的文章ID' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT id, visitor_id, content, city, created_at
       FROM comments
       WHERE post_id = $1 AND status = 'approved'
       ORDER BY created_at DESC`,
      [postId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (Number.isNaN(postId)) {
    return NextResponse.json({ success: false, message: '无效的文章ID' }, { status: 400 });
  }

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

    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown';

    let city = '';
    if (ipAddress && ipAddress !== 'unknown') {
      try {
        const geo = await fetch(`http://ip-api.com/json/${ipAddress}?lang=zh-CN`);
        if (geo.ok) {
          const data = await geo.json();
          city = data.city || '';
        }
      } catch {
        // ignore geo errors
      }
    }

    const result = await query(
      `INSERT INTO comments (post_id, visitor_id, ip_address, city, content, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, visitor_id, content, city, status, created_at`,
      [postId, visitorId, ipAddress, city, content.trim(), status]
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
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
