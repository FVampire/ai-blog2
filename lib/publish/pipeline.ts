import { after } from 'next/server';

import { resolveTagIds } from '../agent-utils';
import { generateEmbedding } from '../embedding';
import { PostRepository } from '../repositories/PostRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { TagRepository } from '../repositories/TagRepository';
import { VectorRepository } from '../repositories/VectorRepository';
import { siteBaseUrl } from '../site-url';
import { distributePublishedPost } from './distribute';
import { generateExcerpt, suggestTags } from './enrich';
import { pingIndexNow } from './indexnow';
import { createDistributionJob } from './jobs';

export interface PipelineOptions {
  previousStatus?: string | null;
  forceDistribute?: boolean;
}

async function settingFlag(key: string, fallback = false): Promise<boolean> {
  const value = await SettingsRepository.getSettingValue(key, fallback);
  return value === true || String(value).toLowerCase() === 'true';
}

async function enrichPost(postId: number): Promise<void> {
  const post = await PostRepository.getPostById(postId);
  if (!post || post.status !== 'published') return;

  const needsExcerpt = !post.excerpt?.trim();
  const needsTags = !post.tags || post.tags.length === 0;
  if (!needsExcerpt && !needsTags) return;

  const updates: { excerpt?: string; tagIds?: number[] } = {};

  if (needsExcerpt) {
    updates.excerpt = await generateExcerpt(post.title, post.content || '');
  }

  if (needsTags) {
    const existing = await TagRepository.getAllTags();
    const names = await suggestTags(post.title, post.content || '', existing.map((tag) => tag.name));
    if (names.length > 0) {
      updates.tagIds = await resolveTagIds(
        names,
        TagRepository,
        (data) => TagRepository.createTag(data),
      );
    }
  }

  if (Object.keys(updates).length > 0) {
    await PostRepository.updatePost(postId, updates);
  }
}

async function embedPost(postId: number): Promise<void> {
  const post = await PostRepository.getPostById(postId);
  if (!post || post.status !== 'published') return;
  if (!(await settingFlag('ai_vector_search_enabled', true))) return;

  const vectors = await generateEmbedding(post.title, post.content || '', post.excerpt);
  if (!vectors) return;
  await VectorRepository.saveVectors(postId, vectors);
}

async function notifyIndexNow(postSlug: string, postId: number): Promise<void> {
  if (!(await settingFlag('distribute_indexnow_enabled', false))) return;
  const key = String(
    process.env.INDEXNOW_KEY || '',
  ).trim();
  if (!key) {
    await createDistributionJob({
      postId,
      channel: 'indexnow',
      status: 'skipped',
      error: '未配置 IndexNow 密钥',
    });
    return;
  }

  const url = `${siteBaseUrl()}/posts/${postSlug}`;
  const result = await pingIndexNow([url, `${siteBaseUrl()}/articles`, `${siteBaseUrl()}/sitemap.xml`], key);
  await createDistributionJob({
    postId,
    channel: 'indexnow',
    status: result.ok ? 'sent' : 'failed',
    payload: { url },
    result,
    error: result.ok ? undefined : result.message,
  });
}

export async function runPublishPipeline(postId: number, options: PipelineOptions = {}): Promise<void> {
  try {
    if (!(await settingFlag('distribute_enabled', true))) return;
    const post = await PostRepository.getPostById(postId);
    if (!post) return;

    const published = post.status === 'published';
    if (!published) return;

    await enrichPost(postId);
    await embedPost(postId);

    const fresh = await PostRepository.getPostById(postId);
    if (!fresh) return;
    await notifyIndexNow(fresh.slug, postId);

    const justPublished = options.previousStatus !== 'published';
    const redistribute = await settingFlag('distribute_on_update', false);
    if (justPublished || options.forceDistribute || redistribute) {
      await distributePublishedPost({
        id: fresh.id,
        title: fresh.title,
        slug: fresh.slug,
        excerpt: fresh.excerpt || '',
        content: fresh.content || '',
        imageUrl: fresh.imageUrl || '',
        tags: fresh.tags || [],
      });
    }
  } catch (error) {
    console.error('Publish pipeline error:', error);
  }
}

export function schedulePublishPipeline(postId: number, options: PipelineOptions = {}): void {
  after(() => {
    void runPublishPipeline(postId, options);
  });
}
