import { NextRequest, NextResponse } from 'next/server';

import { recordAuditEvent } from '@/lib/audit-log';
import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';
import { initializeDatabase } from '@/lib/datasource';
import { query } from '@/lib/db';
import { SeriesRepository } from '@/lib/repositories/SeriesRepository';

interface PostRow {
  id: number;
  title: string;
  slug: string;
  status: string;
  prevPostId: number | null;
  nextPostId: number | null;
  updatedAt: string;
}

interface SeriesGroup {
  id: string;
  posts: PostRow[];
  issue?: 'broken' | 'cycle';
}

function buildSeries(posts: PostRow[]): { series: SeriesGroup[]; unassigned: PostRow[] } {
  const byId = new Map(posts.map((post) => [post.id, post]));
  const linked = posts.filter((post) => post.prevPostId !== null || post.nextPostId !== null);
  const visited = new Set<number>();
  const groups: SeriesGroup[] = [];

  const walk = (start: PostRow, issue?: SeriesGroup['issue']) => {
    const chain: PostRow[] = [];
    const local = new Set<number>();
    let current: PostRow | undefined = start;
    let chainIssue = issue;

    while (current && !visited.has(current.id)) {
      if (local.has(current.id)) {
        chainIssue = 'cycle';
        break;
      }
      local.add(current.id);
      visited.add(current.id);
      chain.push(current);
      if (current.nextPostId === null) break;
      const next = byId.get(current.nextPostId);
      if (!next) {
        chainIssue = 'broken';
        break;
      }
      current = next;
    }

    if (chain.length > 0) {
      groups.push({ id: chain.map((post) => post.id).join('-'), posts: chain, issue: chainIssue });
    }
  };

  linked
    .filter((post) => post.prevPostId === null || !byId.has(post.prevPostId))
    .forEach((post) => walk(post, post.prevPostId !== null ? 'broken' : undefined));
  linked.filter((post) => !visited.has(post.id)).forEach((post) => walk(post, 'cycle'));

  return {
    series: groups.sort((a, b) => b.posts.length - a.posts.length),
    unassigned: posts.filter((post) => post.prevPostId === null && post.nextPostId === null),
  };
}

export async function GET(request: NextRequest) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  try {
    const postsResult = await query(
      `SELECT id, title, slug, status,
        prev_post_id AS "prevPostId", next_post_id AS "nextPostId", updated_at AS "updatedAt"
       FROM posts
       ORDER BY COALESCE(published_at, created_at) DESC`,
    );
    const posts = postsResult.rows as PostRow[];
    const chainData = buildSeries(posts);
    let seriesRecords: Awaited<ReturnType<typeof SeriesRepository.listAll>> = [];
    try {
      seriesRecords = await SeriesRepository.listAll();
    } catch (error) {
      console.warn('Series table is unavailable:', error);
    }
    const series = chainData.series.map((group) => {
      const firstId = group.posts[0]?.id;
      const record = seriesRecords.find((item) => item.posts.some((post) => post.id === firstId));
      return {
        ...group,
        seriesId: record?.id || null,
        slug: record?.slug || null,
        title: record?.title || group.posts[0]?.title || '未命名系列',
        description: record?.description || '',
        coverUrl: record?.coverUrl || '',
        publicUrl: record?.slug ? `/series/${record.slug}` : null,
      };
    });

    let activity: unknown[] = [];
    let stats = { published30d: 0, uploads30d: 0, projects30d: 0, lastActivityAt: null as string | null };
    try {
      const [activityResult, statsResult] = await Promise.all([
        query(
          `SELECT id, action, resource_type AS "resourceType", resource_id AS "resourceId",
            metadata, actor_username AS "actorUsername", created_at AS "createdAt"
           FROM audit_logs
           WHERE action LIKE 'agent.%'
           ORDER BY created_at DESC
           LIMIT 80`,
        ),
        query(
          `SELECT
            COUNT(*) FILTER (WHERE action = 'agent.post.publish' AND created_at >= NOW() - INTERVAL '30 days')::int AS "published30d",
            COUNT(*) FILTER (WHERE action = 'agent.media.upload' AND created_at >= NOW() - INTERVAL '30 days')::int AS "uploads30d",
            COUNT(*) FILTER (WHERE action = 'agent.project.create' AND created_at >= NOW() - INTERVAL '30 days')::int AS "projects30d",
            MAX(created_at) AS "lastActivityAt"
           FROM audit_logs
           WHERE action LIKE 'agent.%'`,
        ),
      ]);
      activity = activityResult.rows;
      if (statsResult.rows[0]) stats = statsResult.rows[0] as typeof stats;
    } catch (error) {
      console.warn('Agent audit data is unavailable:', error);
    }

    return NextResponse.json({
      success: true,
      data: { series, unassigned: chainData.unassigned, posts, activity, stats },
    });
  } catch (error) {
    console.error('Get Agent console data error:', error);
    return NextResponse.json({ success: false, message: '获取 Agent 控制台数据失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const postIds = Array.isArray(body.postIds) ? body.postIds.map(Number) : [];
    const previousPostIds = Array.isArray(body.previousPostIds) ? body.previousPostIds.map(Number) : [];
    const allIds = [...new Set([...postIds, ...previousPostIds])];

    if (postIds.length < 2 || postIds.some((id: number) => !Number.isInteger(id) || id <= 0)) {
      return NextResponse.json({ success: false, message: '一个系列至少需要两篇有效文章' }, { status: 400 });
    }
    if (new Set(postIds).size !== postIds.length) {
      return NextResponse.json({ success: false, message: '系列中不能重复添加同一篇文章' }, { status: 400 });
    }
    if (previousPostIds.some((id: number) => !Number.isInteger(id) || id <= 0)) {
      return NextResponse.json({ success: false, message: '原系列文章 ID 无效' }, { status: 400 });
    }

    const ds = await initializeDatabase();
    await ds.transaction(async (manager) => {
      const existing = await manager.query('SELECT id FROM posts WHERE id = ANY($1::int[]) FOR UPDATE', [allIds]);
      if (existing.length !== allIds.length) throw new Error('POST_NOT_FOUND');

      await manager.query(
        `UPDATE posts SET prev_post_id = NULL
         WHERE prev_post_id = ANY($1::int[]) AND NOT (id = ANY($1::int[]))`,
        [allIds],
      );
      await manager.query(
        `UPDATE posts SET next_post_id = NULL
         WHERE next_post_id = ANY($1::int[]) AND NOT (id = ANY($1::int[]))`,
        [allIds],
      );
      await manager.query(
        'UPDATE posts SET prev_post_id = NULL, next_post_id = NULL WHERE id = ANY($1::int[])',
        [allIds],
      );

      for (let index = 0; index < postIds.length; index += 1) {
        await manager.query(
          'UPDATE posts SET prev_post_id = $1, next_post_id = $2 WHERE id = $3',
          [postIds[index - 1] || null, postIds[index + 1] || null, postIds[index]],
        );
      }
    });

    const series = await SeriesRepository.saveChain(postIds, {
      seriesId: body.seriesId ? Number(body.seriesId) : undefined,
      title: typeof body.title === 'string' ? body.title : undefined,
      slug: typeof body.slug === 'string' ? body.slug : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      coverUrl: typeof body.coverUrl === 'string' ? body.coverUrl : undefined,
      previousPostIds,
    });

    await recordAuditEvent({
      request,
      user: authResult.user,
      action: 'admin.series.update',
      resourceType: 'post_series',
      resourceId: series.id,
      metadata: { postIds, previousPostIds, slug: series.slug },
    });

    return NextResponse.json({
      success: true,
      message: '系列顺序已保存',
      data: { seriesId: series.id, slug: series.slug, url: `/series/${series.slug}` },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'POST_NOT_FOUND') {
      return NextResponse.json({ success: false, message: '部分文章不存在，请刷新后重试' }, { status: 404 });
    }
    console.error('Update post series error:', error);
    return NextResponse.json({ success: false, message: '保存系列失败' }, { status: 500 });
  }
}
