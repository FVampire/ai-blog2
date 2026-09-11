"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import AdminLayout from "../../../components/admin/AdminLayout";
import { authJson } from "../../../components/admin/authFetch";
import MCPManager from "../../../components/admin/MCPManager";
import AISettings from "../../../components/admin/settings/AISettings";
import DistributionSettings from "../../../components/admin/settings/DistributionSettings";
import {
  collectMaskedKeys,
  MASKED_FIELD_PLACEHOLDER,
} from "../../../components/admin/settings/sensitive";
import SocialSettings from "../../../components/admin/settings/SocialSettings";
import { toast } from "../../../components/admin/Toast";
import VectorManager from "../../../components/admin/VectorManager";

interface SettingDetail {
  value: any;
  type: string;
  description: string;
}
type SettingsDetails = Record<string, SettingDetail>;
type DistributionEnvironment = Record<string, boolean>;

export default function AdminSettings() {
  const pathname = usePathname();
  const section = pathname.startsWith("/admin/integrations")
    ? "integrations"
    : "site";
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [details, setDetails] = useState<SettingsDetails>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingFeishu, setTestingFeishu] = useState(false);
  const [activeTab, setActiveTab] = useState(
    section === "integrations" ? "ai" : "basic",
  );
  const [socialLinks, setSocialLinks] = useState<
    Array<{ platform: string; name: string; url: string }>
  >([]);
  const [maskedKeys, setMaskedKeys] = useState<string[]>([]);
  const [dirtyKeys, setDirtyKeys] = useState<string[]>([]);
  const latestSettings = useRef(settings);
  latestSettings.current = settings;
  const [distributionEnvironment, setDistributionEnvironment] =
    useState<DistributionEnvironment>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const result = await authJson<{
      settings: Record<string, any>;
      details: SettingsDetails;
      distributionEnvironment: DistributionEnvironment;
    }>("/api/settings");
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message || "获取设置失败");
      return;
    }

    setSettings(result.data.settings);
    setDetails(result.data.details);
    setMaskedKeys(collectMaskedKeys(result.data.details));
    setDistributionEnvironment(result.data.distributionEnvironment || {});
    if (result.data.settings.about_social_links)
      setSocialLinks(result.data.settings.about_social_links);
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => Array.from(new Set([...prev, key])));
  };
  const handleSocialLinksChange = (
    links: Array<{ platform: string; name: string; url: string }>,
  ) => {
    setSocialLinks(links);
    setDirtyKeys((prev) =>
      Array.from(new Set([...prev, "about_social_links"])),
    );
  };

  const handleSave = async () => {
    setSaving(true);

    // 脱敏字段的 value 是 null，不能当成"用户清空"写回数据库
    const settingsToSave: Record<string, any> = {};
    Object.entries(settings).forEach(([key, value]) => {
      if (!dirtyKeys.includes(key)) return;
      settingsToSave[key] = value;
    });
    if (dirtyKeys.includes("about_social_links"))
      settingsToSave.about_social_links = socialLinks;

    const result = await authJson<{
      updatedKeys: string[];
      ignoredKeys: string[];
    }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify({ settings: settingsToSave }),
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.message || "保存失败");
      return;
    }

    const ignoredKeys = result.data?.ignoredKeys || [];
    const unchanged = (result.data?.updatedKeys || []).filter(
      (key) => latestSettings.current[key] === settingsToSave[key],
    );
    setDirtyKeys((prev) => prev.filter((key) => !unchanged.includes(key)));
    setSettings((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([key, value]) => [
          key,
          unchanged.includes(key) &&
          key.startsWith("ai_") &&
          key.includes("api_key")
            ? null
            : value,
        ]),
      ),
    );
    toast.success(
      ignoredKeys.length > 0
        ? `设置已保存（已忽略未知配置项：${ignoredKeys.join("、")}）`
        : "设置已保存",
    );
  };

  const handleTestFeishu = async () => {
    setTestingFeishu(true);
    const webhookUrl =
      typeof settings.feishu_webhook_url === "string"
        ? settings.feishu_webhook_url.trim()
        : "";
    const webhookSecret =
      typeof settings.feishu_webhook_secret === "string"
        ? settings.feishu_webhook_secret
        : "";
    const result = await authJson("/api/admin/feishu/test", {
      method: "POST",
      body: JSON.stringify({
        ...(webhookUrl ? { webhookUrl } : {}),
        ...(webhookSecret ? { webhookSecret } : {}),
      }),
    });
    setTestingFeishu(false);
    if (result.success)
      toast.success(result.message || "已发送测试消息，请到飞书查看");
    else toast.error(result.message || "发送失败");
  };

  const renderInput = (key: string, detail: SettingDetail) => {
    const { type } = detail;
    const value = settings[key];
    if (key === "about_social_links")
      return (
        <SocialSettings
          initialLinks={socialLinks}
          onChange={handleSocialLinksChange}
        />
      );
    if (maskedKeys.includes(key))
      return (
        <input
          type="password"
          value=""
          disabled
          placeholder={MASKED_FIELD_PLACEHOLDER}
          className="settings-input settings-input-masked"
        />
      );
    if (type === "boolean")
      return (
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => handleChange(key, e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      );
    if (type === "number")
      return (
        <input
          type="number"
          value={value || ""}
          onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
          className="settings-input"
        />
      );
    if (key === "ai_provider")
      return (
        <select
          value={value || "openai"}
          onChange={(e) => handleChange(key, e.target.value)}
          className="settings-select"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="deepseek">DeepSeek</option>
          <option value="moonshot">Moonshot</option>
          <option value="qwen">通义千问</option>
          <option value="other">其他</option>
        </select>
      );
    if (key === "ai_api_key" || key === "feishu_webhook_secret")
      return (
        <input
          type="password"
          value={value || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          className="settings-input"
          placeholder={
            key === "ai_api_key" ? "sk-..." : "可选，若机器人开启了签名校验"
          }
        />
      );
    if (key === "feishu_webhook_url")
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          className="settings-input"
          placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
        />
      );
    if (
      key === "analytics_code" ||
      key === "footer_text" ||
      key === "ai_assistant_system_prompt" ||
      key === "ai_assistant_welcome"
    )
      return (
        <textarea
          value={value || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          className="settings-textarea"
          rows={key === "ai_assistant_system_prompt" ? 4 : 3}
        />
      );
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => handleChange(key, e.target.value)}
        className="settings-input"
      />
    );
  };

  const allTabs = [
    { id: "basic", name: "站点与外观" },
    { id: "projects", name: "项目展示" },
    { id: "comments", name: "评论设置" },
    { id: "users", name: "用户设置" },
    { id: "upload", name: "上传设置" },
    { id: "distribute", name: "发布分发" },
    { id: "ai", name: "AI 设置" },
    { id: "vector", name: "向量搜索" },
    { id: "mcp", name: "MCP 设置" },
  ];
  const tabs = allTabs.filter((tab) =>
    section === "integrations"
      ? ["ai", "vector", "mcp"].includes(tab.id)
      : !["ai", "vector", "mcp"].includes(tab.id),
  );

  const settingGroups: Record<string, string[]> = {
    basic: [
      "site_name",
      "site_description",
      "site_keywords",
      "site_logo",
      "site_favicon",
      "posts_per_page",
      "comments_per_page",
      "excerpt_length",
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
    ],
    projects: [
      "projects_enabled",
      "projects_show_on_home",
      "projects_home_count",
      "projects_intro",
      "projects_nav_label",
    ],
    comments: [
      "comments_enabled",
      "comments_moderation",
      "comments_guest_allowed",
      "feishu_notify_enabled",
      "feishu_webhook_url",
      "feishu_webhook_secret",
    ],
    users: ["registration_enabled", "default_user_role"],
    upload: ["upload_max_size", "upload_allowed_types"],
    ai: [],
    vector: [
      "ai_vector_search_enabled",
      "ai_vector_search_threshold",
      "ai_vector_search_weight_title",
      "ai_vector_search_weight_content",
      "ai_vector_search_weight_excerpt",
    ],
    mcp: ["mcp_enabled", "mcp_allow_user_select"],
  };

  const settingLabels: Record<string, string> = {
    site_name: "网站名称",
    site_description: "网站描述",
    site_keywords: "网站关键词",
    site_logo: "网站Logo URL",
    site_favicon: "网站Favicon URL",
    posts_per_page: "每页文章数",
    comments_per_page: "每页评论数",
    excerpt_length: "摘要字数",
    comments_enabled: "开启评论",
    comments_moderation: "评论需审核",
    comments_guest_allowed: "允许游客评论",
    feishu_notify_enabled: "飞书评论通知",
    feishu_webhook_url: "飞书 Webhook",
    feishu_webhook_secret: "飞书签名密钥",
    registration_enabled: "开放注册",
    default_user_role: "默认用户角色",
    upload_max_size: "最大上传大小(MB)",
    upload_allowed_types: "允许的文件类型",
    about_author_name: "作者名称",
    about_author_bio_short: "首页简介",
    about_author_bio: "个人定位",
    about_author_bio_2: "行业项目",
    about_author_bio_3: "工作流与当前方向",
    about_author_bio_4: "代表作品",
    author_avatar: "作者头像 URL",
    about_social_links: "社交链接",
    footer_text: "页脚文字",
    analytics_code: "统计代码",
    projects_enabled: "启用项目展示",
    projects_show_on_home: "首页显示精选项目",
    projects_home_count: "首页项目数量",
    projects_intro: "项目页介绍文字",
    projects_nav_label: "导航栏项目名称",
    ai_enabled: "启用AI功能",
    ai_provider: "AI服务商",
    ai_api_key: "API密钥",
    ai_api_base_url: "API地址(可选)",
    ai_model: "模型名称",
    ai_model_light: "轻量模型名称",
    ai_embedding_model: "Embedding模型名称",
    ai_assistant_enabled: "启用AI助手",
    ai_assistant_name: "助手名称",
    ai_assistant_welcome: "欢迎语",
    ai_assistant_system_prompt: "系统提示词",
    ai_vector_search_enabled: "启用向量搜索",
    ai_vector_search_threshold: "相似度阈值 (0-1)",
    ai_vector_search_weight_title: "标题权重",
    ai_vector_search_weight_content: "内容权重",
    ai_vector_search_weight_excerpt: "摘要权重",
    mcp_enabled: "启用MCP功能",
    mcp_allow_user_select: "允许用户选择MCP服务器",
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="settings-loading">
          <p>加载中...</p>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="settings-page">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">
              {section === "integrations" ? "系统能力" : "运营配置"}
            </p>
            <h1 className="page-title">
              {section === "integrations" ? "AI / 向量 / MCP" : "站点设置"}
            </h1>
            <p className="page-description">
              {section === "integrations"
                ? "集中管理模型、检索与外部工具连接。"
                : "管理站点外观、内容展示、评论和上传策略。"}
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
        </div>
        <div className="settings-container">
          <div className="settings-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-name">{tab.name}</span>
              </button>
            ))}
          </div>
          <div
            className={`settings-content ${activeTab === "vector" || activeTab === "mcp" ? "grid-layout" : ""}`}
          >
            {activeTab === "ai" ? (
              <AISettings settings={settings} onChange={handleChange} />
            ) : activeTab === "distribute" ? (
              <DistributionSettings
                settings={settings}
                environment={distributionEnvironment}
                onChange={handleChange}
              />
            ) : activeTab === "vector" ? (
              <VectorManager />
            ) : activeTab === "mcp" ? (
              <MCPManager
                settings={settings}
                details={details}
                onChange={handleChange}
              />
            ) : (
              <>
                {settingGroups[activeTab]?.map((key) => {
                  const detail = details[key];
                  if (!detail) return null;
                  return (
                    <div key={key} className="setting-item">
                      <div className="setting-label">
                        <span className="label-text">
                          {settingLabels[key] || key}
                        </span>
                        <span className="label-desc">{detail.description}</span>
                      </div>
                      <div className="setting-control">
                        {renderInput(key, detail)}
                      </div>
                    </div>
                  );
                })}
                {activeTab === "comments" && (
                  <div className="setting-item">
                    <div className="setting-label">
                      <span className="label-text">发送测试消息</span>
                      <span className="label-desc">
                        在飞书群添加自定义机器人后，把 Webhook
                        地址填到上方，可先发一条测试卡片确认通道可用。
                      </span>
                    </div>
                    <div className="setting-control">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleTestFeishu}
                        disabled={testingFeishu}
                      >
                        {testingFeishu ? "发送中..." : "发送飞书测试通知"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
