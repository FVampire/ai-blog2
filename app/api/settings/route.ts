import { NextRequest, NextResponse } from "next/server";

import {
  requireAuth,
  requireRoles,
  isAuthError,
} from "@/lib/auth-middleware-app";
import { query, getClient } from "@/lib/db";
import { aiDefaults, aiSettingSchemas } from "@/lib/ai/config";
import { parseSettingValue } from "@/lib/setting-values";

function serializeSettingValue(value: unknown, type: string): string {
  switch (type) {
    case "number":
      return String(value);
    case "boolean":
      return value ? "true" : "false";
    case "json":
      return JSON.stringify(value);
    default:
      return String(value);
  }
}

const SENSITIVE_SETTING_KEYS = [
  "ai_api_key",
  "ai_embedding_api_key",
  "feishu_webhook_url",
  "feishu_webhook_secret",
];
const SENSITIVE_KEY_PATTERNS = [
  "api_key",
  "apikey",
  "secret",
  "token",
  "password",
  "webhook",
];
const ENV_ONLY_DISTRIBUTION_KEYS = new Set([
  "distribute_indexnow_key",
  "distribute_webhook_url",
  "distribute_telegram_bot_token",
  "distribute_discord_webhook_url",
  "distribute_wechat_app_secret",
  "distribute_bilibili_webhook",
  "distribute_xiaohongshu_webhook",
  "distribute_douyin_webhook",
]);

// Only settings represented by a supported admin control may be changed through this endpoint.
// Database rows are not an authorization boundary: deployments can contain internal-only keys.
const WRITABLE_SETTING_KEYS = new Set([
  "site_name",
  "site_description",
  "site_keywords",
  "site_logo",
  "site_favicon",
  "posts_per_page",
  "comments_per_page",
  "excerpt_length",
  "projects_enabled",
  "projects_show_on_home",
  "projects_home_count",
  "projects_intro",
  "projects_nav_label",
  "comments_enabled",
  "comments_moderation",
  "comments_guest_allowed",
  "feishu_notify_enabled",
  "feishu_webhook_url",
  "feishu_webhook_secret",
  "registration_enabled",
  "default_user_role",
  "upload_max_size",
  "upload_allowed_types",
  "social_github",
  "social_twitter",
  "social_weibo",
  "about_author_name",
  "about_author_bio_short",
  "about_author_bio",
  "about_author_bio_2",
  "about_author_bio_3",
  "about_author_bio_4",
  "author_avatar",
  "about_social_links",
  "footer_text",
  "analytics_code",
  "ai_enabled",
  "ai_provider",
  "ai_api_key",
  "ai_api_base_url",
  "ai_model",
  "ai_model_light",
  "ai_embedding_model",
  "ai_embedding_api_key",
  "ai_assistant_enabled",
  "ai_assistant_name",
  "ai_assistant_avatar",
  "ai_assistant_welcome",
  "ai_assistant_system_prompt",
  "ai_summary_enabled",
  "ai_search_enabled",
  "ai_vector_search_enabled",
  "ai_vector_search_threshold",
  "ai_vector_search_weight_title",
  "ai_vector_search_weight_content",
  "ai_vector_search_weight_excerpt",
  "ai_temperature",
  "ai_max_tokens",
  "mcp_enabled",
  "mcp_allow_user_select",
  "distribute_enabled",
  "distribute_on_update",
  "distribute_indexnow_enabled",
  "distribute_telegram_enabled",
  "distribute_telegram_chat_id",
  "distribute_wechat_enabled",
  "distribute_wechat_app_id",
]);

function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return (
    SENSITIVE_SETTING_KEYS.includes(lowerKey) ||
    SENSITIVE_KEY_PATTERNS.some((pattern) => lowerKey.includes(pattern))
  );
}

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const canReadSecrets = authResult.user.role === "admin";

  try {
    const result = await query(
      "SELECT key, value, type, description FROM settings ORDER BY key",
    );

    const settings: Record<string, unknown> = { ...aiDefaults };
    const settingsDetails: Record<
      string,
      { value: unknown; type: string; description: string }
    > = {};

    result.rows.forEach((row: any) => {
      const masked =
        ENV_ONLY_DISTRIBUTION_KEYS.has(row.key) ||
        (isSensitiveKey(row.key) &&
          (row.key.startsWith("ai_") || !canReadSecrets));
      const value = masked ? null : parseSettingValue(row.value, row.type);
      settings[row.key] = value;
      settingsDetails[row.key] = {
        value,
        type: row.type,
        description: row.description,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        settings,
        details: settingsDetails,
        distributionEnvironment: {
          indexNow: Boolean(process.env.INDEXNOW_KEY),
          genericWebhook: Boolean(process.env.DISTRIBUTE_WEBHOOK_URL),
          telegramToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
          telegramChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
          discordWebhook: Boolean(process.env.DISCORD_WEBHOOK_URL),
          wechatAppId: Boolean(process.env.WECHAT_APP_ID),
          wechatAppSecret: Boolean(process.env.WECHAT_APP_SECRET),
          wechatAutoPublish:
            String(process.env.WECHAT_AUTO_PUBLISH || "").toLowerCase() ===
            "true",
          bilibiliWebhook: Boolean(process.env.BILIBILI_WEBHOOK_URL),
          xiaohongshuWebhook: Boolean(process.env.XIAOHONGSHU_WEBHOOK_URL),
          douyinWebhook: Boolean(process.env.DOUYIN_WEBHOOK_URL),
        },
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { success: false, message: "获取设置失败" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = requireRoles(request, ["admin"]);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, message: "无效的设置数据" },
        { status: 400 },
      );
    }

    const existingSettings = await query("SELECT key, type FROM settings");
    const typeMap: Record<string, string> = {};
    existingSettings.rows.forEach((row: any) => {
      typeMap[row.key] = row.type;
    });

    const updatedKeys: string[] = [];
    const ignoredKeys: string[] = [];

    const updates = Object.entries(settings);
    const validated: { key: string; value: unknown; type: string }[] = [];
    for (const [key, value] of updates) {
      const schema = aiSettingSchemas[key as keyof typeof aiSettingSchemas];
      let type = typeMap[key];
      if (schema) {
        if (value === null && isSensitiveKey(key)) continue;
        const checked = schema.safeParse(value);
        if (!checked.success)
          return NextResponse.json(
            {
              success: false,
              message: `${key} 配置无效：${checked.error.issues[0]?.message}`,
            },
            { status: 400 },
          );
        type =
          typeof value === "boolean"
            ? "boolean"
            : typeof value === "number"
              ? "number"
              : typeof value === "object"
                ? "json"
                : "string";
      }
      if ((!type || !WRITABLE_SETTING_KEYS.has(key)) && !schema) {
        ignoredKeys.push(key);
        continue;
      }
      validated.push({ key, value, type });
      updatedKeys.push(key);
    }
    const client = await getClient();
    try {
      await client.query("BEGIN");
      for (const item of validated) {
        await client.query(
          "INSERT INTO settings (key, value, type) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, type = EXCLUDED.type, updated_at = CURRENT_TIMESTAMP",
          [item.key, serializeSettingValue(item.value, item.type), item.type],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message:
        ignoredKeys.length > 0
          ? `设置已更新，已忽略未知配置项：${ignoredKeys.join("、")}`
          : "设置已更新",
      data: { updatedKeys, ignoredKeys },
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, message: "更新设置失败" },
      { status: 500 },
    );
  }
}
