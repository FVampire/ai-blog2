import { SettingsRepository } from '../repositories/SettingsRepository';
import { publicMediaUrl, rewriteMarkdownMediaUrls } from '../media-url';
import { absoluteUrl, siteBaseUrl } from '../site-url';
import { renderMarkdown } from '../tools/markdown/render';
import { createDistributionJob, hasSuccessfulJob } from './jobs';
import { buildSocialCopies, maybeRewriteSocialCopy, type SocialCopy, type SocialPlatform } from './social-copy';
import { createWechatDraft, submitWechatDraft } from './wechat-client';

export interface DistributePost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  tags: Array<{ name: string }>;
}

interface ChannelConfig {
  enabled: boolean;
  webhookUrl: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  discordWebhookUrl: string;
  wechatEnabled: boolean;
  wechatAppId: string;
  wechatAppSecret: string;
  wechatAutoPublish: boolean;
  bilibiliWebhook: string;
  xiaohongshuWebhook: string;
  douyinWebhook: string;
  feishuEnabled: boolean;
  feishuWebhookUrl: string;
  feishuSecret: string;
}

function publishedMediaUrl(imageUrl: string): string {
  const exposed = publicMediaUrl(imageUrl);
  return /^https?:\/\//i.test(exposed) ? exposed : absoluteUrl(exposed);
}

function flag(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  return String(value || '').toLowerCase() === 'true';
}

async function loadChannelConfig(): Promise<ChannelConfig> {
  const rows = await SettingsRepository.getSettingsByKeys([
    'distribute_enabled',
    'distribute_telegram_enabled',
    'distribute_telegram_chat_id',
    'distribute_wechat_enabled',
    'distribute_wechat_app_id',
    'feishu_notify_enabled',
  ]);
  const settings: Record<string, string> = {};
  rows.forEach((row) => {
    settings[row.key] = row.value;
  });

  return {
    enabled: flag(settings.distribute_enabled ?? 'true'),
    webhookUrl: process.env.DISTRIBUTE_WEBHOOK_URL || '',
    telegramEnabled: flag(settings.distribute_telegram_enabled),
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || settings.distribute_telegram_chat_id || '',
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    wechatEnabled: flag(settings.distribute_wechat_enabled),
    wechatAppId: process.env.WECHAT_APP_ID || settings.distribute_wechat_app_id || '',
    wechatAppSecret: process.env.WECHAT_APP_SECRET || '',
    wechatAutoPublish: flag(process.env.WECHAT_AUTO_PUBLISH),
    bilibiliWebhook: process.env.BILIBILI_WEBHOOK_URL || '',
    xiaohongshuWebhook: process.env.XIAOHONGSHU_WEBHOOK_URL || '',
    douyinWebhook: process.env.DOUYIN_WEBHOOK_URL || '',
    feishuEnabled: flag(settings.feishu_notify_enabled) || Boolean(process.env.FEISHU_WEBHOOK_URL),
    feishuWebhookUrl: process.env.FEISHU_WEBHOOK_URL || '',
    feishuSecret: process.env.FEISHU_WEBHOOK_SECRET || '',
  };
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; status: number; body: string }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: response.ok, status: response.status, body: await response.text().catch(() => '') };
}

async function record(
  postId: number,
  channel: string,
  status: 'sent' | 'failed' | 'skipped' | 'needs_manual',
  payload: unknown,
  result?: unknown,
  error?: string,
) {
  await createDistributionJob({ postId, channel, status, payload, result, error });
}

async function sendTelegram(config: ChannelConfig, post: DistributePost, url: string) {
  if (!config.telegramEnabled || !config.telegramBotToken || !config.telegramChatId) {
    return;
  }
  if (await hasSuccessfulJob(post.id, 'telegram')) return;
  const text = `*${post.title}*\n${post.excerpt || ''}\n${url}`.trim();
  const endpoint = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  try {
    const result = await postJson(endpoint, {
      chat_id: config.telegramChatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });
    await record(post.id, 'telegram', result.ok ? 'sent' : 'failed', { text }, result, result.ok ? undefined : result.body);
  } catch (error) {
    await record(post.id, 'telegram', 'failed', { text }, undefined, error instanceof Error ? error.message : 'Telegram 发送失败');
  }
}

async function sendDiscord(config: ChannelConfig, post: DistributePost, url: string) {
  if (!config.discordWebhookUrl) return;
  if (await hasSuccessfulJob(post.id, 'discord')) return;
  const payload = {
    content: `新文章：${post.title}`,
    embeds: [{
      title: post.title,
      description: post.excerpt || '',
      url,
      image: post.imageUrl ? { url: publishedMediaUrl(post.imageUrl) } : undefined,
    }],
  };
  try {
    const result = await postJson(config.discordWebhookUrl, payload);
    await record(post.id, 'discord', result.ok ? 'sent' : 'failed', payload, result, result.ok ? undefined : result.body);
  } catch (error) {
    await record(post.id, 'discord', 'failed', payload, undefined, error instanceof Error ? error.message : 'Discord 发送失败');
  }
}

async function sendGenericWebhook(config: ChannelConfig, post: DistributePost, url: string) {
  if (!config.webhookUrl) return;
  if (await hasSuccessfulJob(post.id, 'webhook')) return;
  const payload = {
    event: 'post.published',
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      url,
      coverUrl: post.imageUrl ? publishedMediaUrl(post.imageUrl) : '',
      tags: post.tags.map((tag) => tag.name),
    },
  };
  try {
    const result = await postJson(config.webhookUrl, payload);
    await record(post.id, 'webhook', result.ok ? 'sent' : 'failed', payload, result, result.ok ? undefined : result.body);
  } catch (error) {
    await record(post.id, 'webhook', 'failed', payload, undefined, error instanceof Error ? error.message : 'Webhook 发送失败');
  }
}

async function sendFeishu(config: ChannelConfig, post: DistributePost, url: string) {
  if (!config.feishuEnabled || !config.feishuWebhookUrl) return;
  if (await hasSuccessfulJob(post.id, 'feishu')) return;
  const payload: Record<string, unknown> = {
    msg_type: 'interactive',
    card: {
      header: { template: 'turquoise', title: { tag: 'plain_text', content: '博客发布了新文章' } },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: `**${post.title}**\n${post.excerpt || ''}` } },
        { tag: 'action', actions: [{ tag: 'button', type: 'primary', text: { tag: 'plain_text', content: '阅读文章' }, url }] },
      ],
    },
  };
  try {
    const result = await postJson(config.feishuWebhookUrl, payload);
    await record(post.id, 'feishu', result.ok ? 'sent' : 'failed', payload, result, result.ok ? undefined : result.body);
  } catch (error) {
    await record(post.id, 'feishu', 'failed', payload, undefined, error instanceof Error ? error.message : '飞书发送失败');
  }
}

async function sendWechatDraft(config: ChannelConfig, post: DistributePost, copy: SocialCopy) {
  if (!config.wechatEnabled) return;
  if (!config.wechatAppId || !config.wechatAppSecret) {
    await record(post.id, 'wechat', 'needs_manual', copy, undefined, '未配置公众号 AppID / AppSecret');
    return;
  }
  if (await hasSuccessfulJob(post.id, 'wechat')) return;

  try {
    const html = await renderMarkdown(
      rewriteMarkdownMediaUrls(post.content || post.excerpt || post.title),
      { allowHtml: false, sanitize: true },
    );
    const draft = await createWechatDraft({
      appId: config.wechatAppId,
      appSecret: config.wechatAppSecret,
      title: copy.title,
      digest: copy.text,
      content: html,
      sourceUrl: copy.url,
      coverUrl: post.imageUrl,
    });
    if (config.wechatAutoPublish) {
      const published = await submitWechatDraft(
        config.wechatAppId,
        config.wechatAppSecret,
        draft.mediaId,
      );
      await record(post.id, 'wechat', 'sent', copy, {
        stage: 'publish_submitted',
        mediaId: draft.mediaId,
        publishId: published.publishId,
      });
      return;
    }
    await record(post.id, 'wechat', 'sent', copy, { stage: 'draft_created', mediaId: draft.mediaId });
  } catch (error) {
    await record(post.id, 'wechat', 'failed', copy, undefined, error instanceof Error ? error.message : '公众号草稿创建失败');
  }
}

async function sendPlatformWebhook(
  channel: SocialPlatform,
  webhookUrl: string,
  copy: SocialCopy,
  postId: number,
) {
  if (await hasSuccessfulJob(postId, channel)) return;
  if (!webhookUrl) {
    await record(postId, channel, 'needs_manual', copy, undefined, '该平台没有官方个人发文 API，已生成适配文案。可配置 Webhook 接到 n8n / 自建脚本。');
    return;
  }
  try {
    const result = await postJson(webhookUrl, { event: 'post.published', ...copy });
    await record(postId, channel, result.ok ? 'sent' : 'failed', copy, result, result.ok ? undefined : result.body);
  } catch (error) {
    await record(postId, channel, 'failed', copy, undefined, error instanceof Error ? error.message : '平台 Webhook 失败');
  }
}

export async function distributePublishedPost(post: DistributePost): Promise<void> {
  const config = await loadChannelConfig();
  if (!config.enabled) return;

  const url = `${siteBaseUrl()}/posts/${post.slug}`;
  const coverUrl = post.imageUrl ? publishedMediaUrl(post.imageUrl) : '';
  let copies = buildSocialCopies(post, url, coverUrl);
  copies = await maybeRewriteSocialCopy(copies, post);

  await sendGenericWebhook(config, post, url);
  await sendTelegram(config, post, url);
  await sendDiscord(config, post, url);
  await sendFeishu(config, post, url);
  await sendWechatDraft(config, post, copies.wechat);
  await sendPlatformWebhook('bilibili', config.bilibiliWebhook, copies.bilibili, post.id);
  await sendPlatformWebhook('xiaohongshu', config.xiaohongshuWebhook, copies.xiaohongshu, post.id);
  await sendPlatformWebhook('douyin', config.douyinWebhook, copies.douyin, post.id);
}
