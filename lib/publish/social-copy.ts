import { stripMarkdown, truncateText } from '../text-plain';
import { completeChat } from './enrich';

export type SocialPlatform = 'xiaohongshu' | 'bilibili' | 'douyin' | 'wechat';

export interface SocialCopy {
  platform: SocialPlatform;
  title: string;
  text: string;
  tags: string[];
  url: string;
  coverUrl: string;
}

export interface PostForCopy {
  title: string;
  excerpt?: string;
  content?: string;
  tags?: Array<{ name: string }>;
  imageUrl?: string;
}

export function buildSocialCopies(post: PostForCopy, url: string, coverUrl = ''): Record<SocialPlatform, SocialCopy> {
  const tags = (post.tags || []).map((tag) => tag.name).filter(Boolean);
  const excerpt = truncateText(stripMarkdown(post.excerpt || post.content || post.title), 180);
  const hashTags = tags.map((name) => `#${name}`).join(' ');

  return {
    xiaohongshu: {
      platform: 'xiaohongshu',
      title: truncateText(post.title, 20),
      text: [post.title, excerpt, hashTags, `原文：${url}`].filter(Boolean).join('\n\n'),
      tags,
      url,
      coverUrl,
    },
    bilibili: {
      platform: 'bilibili',
      title: truncateText(post.title, 80),
      text: `${excerpt}\n\n完整文章：${url}`,
      tags,
      url,
      coverUrl,
    },
    douyin: {
      platform: 'douyin',
      title: truncateText(post.title, 30),
      text: `${truncateText(excerpt, 100)}\n${url}`,
      tags,
      url,
      coverUrl,
    },
    wechat: {
      platform: 'wechat',
      title: truncateText(post.title, 64),
      text: truncateText(excerpt, 120),
      tags,
      url,
      coverUrl,
    },
  };
}

export async function maybeRewriteSocialCopy(
  copies: Record<SocialPlatform, SocialCopy>,
  post: PostForCopy,
): Promise<Record<SocialPlatform, SocialCopy>> {
  const rewritten = await completeChat(
    '把同一篇文章改写成三个平台的短文案。只返回 JSON：{"xiaohongshu":{"title":"","text":""},"bilibili":{"title":"","text":""},"douyin":{"title":"","text":""}}。小红书口语化带话题，B 站像专栏简介，抖音不超过 80 字。',
    `标题：${post.title}\n摘要：${post.excerpt || ''}`,
  );
  if (!rewritten) return copies;

  try {
    const parsed = JSON.parse(rewritten.replace(/^```json\s*|\s*```$/g, '')) as Record<string, { title?: string; text?: string }>;
    (['xiaohongshu', 'bilibili', 'douyin'] as const).forEach((platform) => {
      if (parsed[platform]?.title) copies[platform].title = parsed[platform].title!;
      if (parsed[platform]?.text) copies[platform].text = parsed[platform].text!;
    });
  } catch {
    // Keep heuristic copies if the model did not return JSON.
  }
  return copies;
}
