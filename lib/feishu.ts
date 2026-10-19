import { createHmac } from 'node:crypto';

const FEISHU_WEBHOOK_HOSTS = new Set(['open.feishu.cn', 'open.larksuite.com']);
const FEISHU_WEBHOOK_PATH = /^\/open-apis\/bot\/v2\/hook\/[A-Za-z0-9_-]+\/?$/;
const COMMENT_CONTENT_LIMIT = 400;
const REQUEST_TIMEOUT_MS = 8_000;

export type CommentNotifyStatus = 'pending' | 'approved' | 'rejected';

export type FeishuEnv = {
  FEISHU_WEBHOOK_URL?: string;
  FEISHU_WEBHOOK_SECRET?: string;
  FEISHU_NOTIFY_COMMENTS?: string;
  SITE_URL?: string;
  [key: string]: string | undefined;
};

export type FeishuSettings = {
  feishu_notify_enabled?: boolean;
  feishu_webhook_url?: string;
  feishu_webhook_secret?: string;
};

export type FeishuConfig = {
  enabled: boolean;
  webhookUrl: string;
  secret: string;
  source: 'env' | 'settings' | 'none';
};

export type CommentNotification = {
  postTitle: string;
  postUrl: string;
  adminUrl: string;
  visitorId: string;
  city?: string;
  content: string;
  status: CommentNotifyStatus;
  needsReview: boolean;
};

export type FeishuSendResult = {
  ok: boolean;
  message: string;
};

const STATUS_LABEL: Record<CommentNotifyStatus, string> = {
  pending: '待审核',
  approved: '已公开',
  rejected: '已拒绝',
};

const STATUS_COLOR: Record<CommentNotifyStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
};

export function isFeishuWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    if (url.port) return false;
    if (url.search || url.hash) return false;
    if (!FEISHU_WEBHOOK_HOSTS.has(url.hostname.toLowerCase())) return false;
    return FEISHU_WEBHOOK_PATH.test(url.pathname);
  } catch {
    return false;
  }
}

export function buildFeishuSign(secret: string, timestamp: string): string {
  const stringToSign = `${timestamp}\n${secret}`;
  return createHmac('sha256', stringToSign).update('').digest('base64');
}

export function escapeLarkMd(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/([*_`[\]~])/g, '\\$1');
}

export function truncateText(text: string, max = COMMENT_CONTENT_LIMIT): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

function parseFlag(value: string | undefined): boolean | null {
  const flag = value?.trim().toLowerCase();
  if (!flag) return null;
  if (flag === 'true' || flag === '1' || flag === 'on' || flag === 'yes') return true;
  if (flag === 'false' || flag === '0' || flag === 'off' || flag === 'no') return false;
  return null;
}

export function resolveFeishuConfig(
  env: FeishuEnv = process.env,
  settings: FeishuSettings = {},
): FeishuConfig {
  const envUrl = env.FEISHU_WEBHOOK_URL?.trim() || '';
  const settingsUrl = settings.feishu_webhook_url?.trim() || '';
  const webhookUrl = envUrl || settingsUrl;
  const source: FeishuConfig['source'] = envUrl ? 'env' : settingsUrl ? 'settings' : 'none';
  const secret = env.FEISHU_WEBHOOK_SECRET?.trim() || settings.feishu_webhook_secret?.trim() || '';

  const envEnabled = parseFlag(env.FEISHU_NOTIFY_COMMENTS);
  let enabled = false;
  if (webhookUrl && isFeishuWebhookUrl(webhookUrl)) {
    if (envEnabled === false) enabled = false;
    else if (envEnabled === true) enabled = true;
    else if (envUrl) enabled = true;
    else enabled = settings.feishu_notify_enabled === true;
  }

  return { enabled, webhookUrl, secret, source };
}

export function siteBaseUrl(env: FeishuEnv = process.env): string {
  return (env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

export function buildCommentNotificationBody(notification: CommentNotification, secret = '', timestamp?: string) {
  const statusLabel = STATUS_LABEL[notification.status];
  const visitor = truncateText(notification.visitorId.replace(/-/g, ''), 8);
  const city = notification.city?.trim() || '未知地区';
  const content = escapeLarkMd(truncateText(notification.content));
  const reviewHint = notification.needsReview ? '（含敏感内容，需审核后公开）' : '';

  const body: Record<string, unknown> = {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        template: STATUS_COLOR[notification.status],
        title: {
          tag: 'plain_text',
          content: notification.needsReview ? '博客收到待审核评论' : '博客收到新评论',
        },
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: [
              `**文章：** [${escapeLarkMd(notification.postTitle)}](${notification.postUrl})`,
              `**访客：** ${escapeLarkMd(visitor)} · ${escapeLarkMd(city)}`,
              `**状态：** ${statusLabel}${reviewHint}`,
            ].join('\n'),
          },
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**评论内容**\n${content || '（空）'}`,
          },
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              type: 'primary',
              url: notification.postUrl,
              text: { tag: 'plain_text', content: '查看文章' },
            },
            {
              tag: 'button',
              type: 'default',
              url: notification.adminUrl,
              text: { tag: 'plain_text', content: '去审核' },
            },
          ],
        },
      ],
    },
  };

  if (secret) {
    const ts = timestamp || String(Math.floor(Date.now() / 1000));
    body.timestamp = ts;
    body.sign = buildFeishuSign(secret, ts);
  }

  return body;
}

export async function sendFeishuWebhook(
  webhookUrl: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<FeishuSendResult> {
  if (!isFeishuWebhookUrl(webhookUrl)) {
    return { ok: false, message: 'Webhook 地址无效，请使用飞书自定义机器人地址' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let payload: { code?: number; msg?: string; StatusCode?: number; StatusMessage?: string } = {};
    try {
      payload = await response.json() as typeof payload;
    } catch {
      payload = {};
    }

    const code = payload.code ?? payload.StatusCode;
    const msg = payload.msg || payload.StatusMessage || '';
    if (response.ok && (code === undefined || code === 0)) {
      return { ok: true, message: '已发送飞书通知' };
    }

    return {
      ok: false,
      message: msg ? `飞书返回错误：${msg}` : `飞书通知失败（HTTP ${response.status}）`,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, message: '飞书通知超时' };
    }
    return { ok: false, message: '飞书通知发送失败' };
  } finally {
    clearTimeout(timer);
  }
}
