import { query } from './db';
import {
  buildCommentNotificationBody,
  isFeishuWebhookUrl,
  resolveFeishuConfig,
  sendFeishuWebhook,
  siteBaseUrl,
  type CommentNotifyStatus,
  type FeishuSendResult,
  type FeishuSettings,
} from './feishu';
import { SettingsRepository } from './repositories/SettingsRepository';

async function loadFeishuSettings(): Promise<FeishuSettings> {
  const rows = await SettingsRepository.getSettingsByKeys([
    'feishu_notify_enabled',
    'feishu_webhook_url',
    'feishu_webhook_secret',
  ]);

  const settings: FeishuSettings = {};
  for (const row of rows) {
    if (row.key === 'feishu_notify_enabled') {
      settings.feishu_notify_enabled = row.value.toLowerCase() === 'true';
    } else if (row.key === 'feishu_webhook_url') {
      settings.feishu_webhook_url = row.value;
    } else if (row.key === 'feishu_webhook_secret') {
      settings.feishu_webhook_secret = row.value;
    }
  }
  return settings;
}

export async function sendTestFeishuNotification(overrides: {
  webhookUrl?: string;
  webhookSecret?: string;
} = {}): Promise<FeishuSendResult> {
  const settings = await loadFeishuSettings();
  const config = resolveFeishuConfig(process.env, settings);
  const webhookUrl = overrides.webhookUrl || config.webhookUrl;
  const secret = overrides.webhookSecret !== undefined ? overrides.webhookSecret : config.secret;

  if (!webhookUrl) {
    return { ok: false, message: '尚未配置飞书 Webhook，请填写自定义机器人地址' };
  }
  if (!isFeishuWebhookUrl(webhookUrl)) {
    return { ok: false, message: 'Webhook 地址无效，请使用飞书自定义机器人地址' };
  }

  const baseUrl = siteBaseUrl();
  return sendFeishuWebhook(
    webhookUrl,
    buildCommentNotificationBody(
      {
        postTitle: '飞书通知测试',
        postUrl: `${baseUrl}/admin/comments`,
        adminUrl: `${baseUrl}/admin/comments`,
        visitorId: 'test-bot',
        city: '本地测试',
        content: '这是一条测试消息。配置成功后，访客发表评论会推送到这里。',
        status: 'approved',
        needsReview: false,
      },
      secret,
    ),
  );
}

export async function notifyCommentCreated(input: {
  postId: number;
  visitorId: string;
  city?: string;
  content: string;
  status: CommentNotifyStatus;
  needsReview: boolean;
}): Promise<void> {
  try {
    const settings = await loadFeishuSettings();
    const config = resolveFeishuConfig(process.env, settings);
    if (!config.enabled) return;

    const postResult = await query(
      'SELECT title, slug FROM posts WHERE id = $1 LIMIT 1',
      [input.postId],
    );
    const post = postResult.rows[0] as { title?: string; slug?: string } | undefined;
    if (!post?.slug) return;

    const baseUrl = siteBaseUrl();
    const result = await sendFeishuWebhook(
      config.webhookUrl,
      buildCommentNotificationBody(
        {
          postTitle: post.title || '未命名文章',
          postUrl: `${baseUrl}/posts/${post.slug}`,
          adminUrl: `${baseUrl}/admin/comments`,
          visitorId: input.visitorId,
          city: input.city,
          content: input.content,
          status: input.status,
          needsReview: input.needsReview,
        },
        config.secret,
      ),
    );

    if (!result.ok) {
      console.error('Feishu comment notify failed:', result.message);
    }
  } catch (error) {
    console.error('Feishu comment notify error:', error);
  }
}
