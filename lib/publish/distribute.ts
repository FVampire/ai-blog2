import { SettingsRepository } from '../repositories/SettingsRepository';
import { publicMediaUrl, rewriteMarkdownMediaUrls } from '../media-url';
import { absoluteUrl, siteBaseUrl } from '../site-url';
import { renderMarkdown } from '../tools/markdown/render';
import { createDistributionJob, hasSuccessfulJob } from './jobs';
import { buildSocialCopies, maybeRewriteSocialCopy, type SocialCopy, type SocialPlatform } from './social-copy';

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
    'distribute_webhook_url',
    'distribute_telegram_enabled',
    'distribute_telegram_bot_token',
    'distribute_telegram_chat_id',
    'distribute_discord_webhook_url',
    'distribute_wechat_enabled',
    'distribute_wechat_app_id',
    'distribute_wechat_app_secret',
    'distribute_bilibili_webhook',
    'distribute_xiaohongshu_webhook',
    'distribute_douyin_webhook',
    'feishu_notify_enabled',
    'feishu_webhook_url',
    'feishu_webhook_secret',
  ]);
  const settings: Record<string, string> = {};
  rows.forEach((row) => {
    settings[row.key] = row.value;
  });

  return {
    enabled: flag(settings.distribute_enabled ?? 'true'),
    webhookUrl: process.env.DISTRIBUTE_WEBHOOK_URL || settings.distribute_webhook_url || '',
    telegramEnabled: flag(settings.distribute_telegram_enabled),
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || settings.distribute_telegram_bot_token || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || settings.distribute_telegram_chat_id || '',
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || settings.distribute_discord_webhook_url || '',
    wechatEnabled: flag(settings.distribute_wechat_enabled),
    wechatAppId: process.env.WECHAT_APP_ID || settings.distribute_wechat_app_id || '',
    wechatAppSecret: process.env.WECHAT_APP_SECRET || settings.distribute_wechat_app_secret || '',
    bilibiliWebhook: settings.distribute_bilibili_webhook || '',
    xiaohongshuWebhook: settings.distribute_xiaohongshu_webhook || '',
    douyinWebhook: settings.distribute_douyin_webhook || '',
    feishuEnabled: flag(settings.feishu_notify_enabled) || Boolean(process.env.FEISHU_WEBHOOK_URL),
    feishuWebhookUrl: process.env.FEISHU_WEBHOOK_URL || settings.feishu_webhook_url || '',
    feishuSecret: process.env.FEISHU_WEBHOOK_SECRET || settings.feishu_webhook_secret || '',
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

async function uploadWechatImage(accessToken: string, imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const remote = await fetch(publishedMediaUrl(imageUrl));
    if (!remote.ok) return null;
    const bytes = Buffer.from(await remote.arrayBuffer());
    const filename = imageUrl.split('/').pop()?.split('?')[0] || 'cover.jpg';
    const form = new FormData();
    form.append('media', new Blob([new Uint8Array(bytes)]), filename);
    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`,
      { method: 'POST', body: form },
    );
    const data = await response.json() as { media_id?: string; errmsg?: string };
    return data.media_id || null;
  } catch (error) {
    console.error('WeChat image upload error:', error);
    return null;
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
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechatAppId}&secret=${config.wechatAppSecret}`,
    );
    const tokenData = await tokenRes.json() as { access_token?: string; errmsg?: string };
    if (!tokenData.access_token) {
      await record(post.id, 'wechat', 'failed', copy, tokenData, tokenData.errmsg || '获取 access_token 失败');
      return;
    }

    const html = await renderMarkdown(
      rewriteMarkdownMediaUrls(post.content || post.excerpt || post.title),
      { allowHtml: false, sanitize: true },
    );
    const thumbMediaId = await uploadWechatImage(tokenData.access_token, post.imageUrl);
    if (!thumbMediaId) {
      await record(post.id, 'wechat', 'needs_manual', { ...copy, html }, undefined, '封面未能上传到公众号素材库，草稿需要 thumb_media_id');
      return;
    }

    const payload = {
      articles: [{
        title: copy.title,
        author: '',
        digest: copy.text,
        content: html,
        content_source_url: copy.url,
        thumb_media_id: thumbMediaId,
        need_open_comment: 0,
        only_fans_can_comment: 0,
      }],
    };
    const result = await postJson(
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${tokenData.access_token}`,
      payload,
    );
    await record(post.id, 'wechat', result.ok ? 'sent' : 'failed', payload, result, result.ok ? undefined : result.body);
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
    const result = await postJson(webhookUrl, { event: 'post.published', platform: channel, ...copy });
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
