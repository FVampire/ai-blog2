'use client';

import React, { useState, useEffect } from "react";

import AdminLayout from "../../../components/admin/AdminLayout";
import { authJson } from "../../../components/admin/authFetch";
import MCPManager from "../../../components/admin/MCPManager";
import AISettings from "../../../components/admin/settings/AISettings";
import { collectMaskedKeys, MASKED_FIELD_PLACEHOLDER } from "../../../components/admin/settings/sensitive";
import SocialSettings from "../../../components/admin/settings/SocialSettings";
import { toast } from "../../../components/admin/Toast";
import VectorManager from "../../../components/admin/VectorManager";

interface SettingDetail { value: any; type: string; description: string; }
type SettingsDetails = Record<string, SettingDetail>;

const settingsStyles = `
  .settings-page { padding: 0; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: 600; color: #111827; margin: 0; }
  .btn-primary { padding: 10px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
  .btn-primary:hover { background: #2563eb; }
  .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
  .message { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
  .message.success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
  .message.error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .settings-container { display: flex; gap: 24px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; width: 100%; }
  .settings-tabs { width: 200px; background: #f9fafb; padding: 16px 0; border-right: 1px solid #e5e7eb; flex-shrink: 0; }
  .tab-btn { display: flex; align-items: center; width: 100%; padding: 12px 20px; border: none; background: none; cursor: pointer; font-size: 14px; color: #6b7280; text-align: left; transition: all 0.2s; }
  .tab-btn:hover { background: #e5e7eb; color: #111827; }
  .tab-btn.active { background: white; color: #3b82f6; border-right: 2px solid #3b82f6; }
  .tab-icon { margin-right: 10px; font-size: 16px; }
  .settings-content { flex: 1; padding: 24px; width: 100%; min-width: 0; }
  .setting-item { display: flex; flex-direction: column; padding: 20px 0; border-bottom: 1px solid #f3f4f6; gap: 12px; }
  .setting-item:last-child { border-bottom: none; }
  .setting-label { width: 100%; }
  .label-text { display: block; font-size: 14px; font-weight: 500; color: #111827; margin-bottom: 6px; }
  .label-desc { display: block; font-size: 12px; color: #6b7280; line-height: 1.5; }
  .setting-control { width: 100%; }
  .settings-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: border-color 0.2s; }
  .settings-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .settings-textarea { width: 100%; min-width: 0; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical; font-family: inherit; }
  .settings-textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .settings-select { width: 100%; min-width: 0; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: white; cursor: pointer; transition: border-color 0.2s; }
  .settings-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .toggle-switch { position: relative; display: inline-block; width: 48px; height: 24px; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #d1d5db; transition: 0.3s; border-radius: 24px; }
  .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%; }
  .toggle-switch input:checked + .toggle-slider { background-color: #3b82f6; }
  .toggle-switch input:checked + .toggle-slider:before { transform: translateX(24px); }
  .settings-loading { display: flex; justify-content: center; align-items: center; height: 300px; color: #6b7280; }
  @media (max-width: 768px) {
    .settings-container { flex-direction: column; }
    .settings-tabs { width: 100%; display: flex; overflow-x: auto; border-right: none; border-bottom: 1px solid #e5e7eb; }
    .tab-btn { flex-shrink: 0; white-space: nowrap; }
    .tab-btn.active { border-right: none; border-bottom: 2px solid #3b82f6; }
    .setting-item { flex-direction: column; gap: 10px; }
  }
`;

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [details, setDetails] = useState<SettingsDetails>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; name: string; url: string }>>([]);
  const [maskedKeys, setMaskedKeys] = useState<string[]>([]);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const result = await authJson<{ settings: Record<string, any>; details: SettingsDetails }>("/api/settings");
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message || "获取设置失败");
      return;
    }

    setSettings(result.data.settings);
    setDetails(result.data.details);
    setMaskedKeys(collectMaskedKeys(result.data.details));
    if (result.data.settings.about_social_links) setSocialLinks(result.data.settings.about_social_links);
  };

  const handleChange = (key: string, value: any) => setSettings((prev) => ({ ...prev, [key]: value }));
  const handleSocialLinksChange = (links: Array<{ platform: string; name: string; url: string }>) => setSocialLinks(links);

  const handleSave = async () => {
    setSaving(true);

    // 脱敏字段的 value 是 null，不能当成"用户清空"写回数据库
    const settingsToSave: Record<string, any> = {};
    Object.entries(settings).forEach(([key, value]) => {
      if (maskedKeys.includes(key)) return;
      settingsToSave[key] = value;
    });
    settingsToSave.about_social_links = socialLinks;

    const result = await authJson<{ updatedKeys: string[]; ignoredKeys: string[] }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify({ settings: settingsToSave }),
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.message || "保存失败");
      return;
    }

    const ignoredKeys = result.data?.ignoredKeys || [];
    toast.success(ignoredKeys.length > 0 ? `设置已保存（已忽略未知配置项：${ignoredKeys.join("、")}）` : "设置已保存");
  };

  const renderInput = (key: string, detail: SettingDetail) => {
    const { type } = detail; const value = settings[key];
    if (key === "about_social_links") return <SocialSettings initialLinks={socialLinks} onChange={handleSocialLinksChange} />;
    if (maskedKeys.includes(key)) return <input type="password" value="" disabled placeholder={MASKED_FIELD_PLACEHOLDER} className="settings-input settings-input-masked" />;
    if (type === "boolean") return (<label className="toggle-switch"><input type="checkbox" checked={value === true} onChange={(e) => handleChange(key, e.target.checked)} /><span className="toggle-slider"></span></label>);
    if (type === "number") return <input type="number" value={value || ""} onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)} className="settings-input" />;
    if (key === "ai_provider") return (<select value={value || "openai"} onChange={(e) => handleChange(key, e.target.value)} className="settings-select"><option value="openai">OpenAI</option><option value="anthropic">Anthropic (Claude)</option><option value="deepseek">DeepSeek</option><option value="moonshot">Moonshot</option><option value="qwen">通义千问</option><option value="other">其他</option></select>);
    if (key === "ai_api_key") return <input type="password" value={value || ""} onChange={(e) => handleChange(key, e.target.value)} className="settings-input" placeholder="sk-..." />;
    if (key === "analytics_code" || key === "footer_text" || key === "ai_assistant_system_prompt" || key === "ai_assistant_welcome") return (<textarea value={value || ""} onChange={(e) => handleChange(key, e.target.value)} className="settings-textarea" rows={key === "ai_assistant_system_prompt" ? 4 : 3} />);
    return <input style={{ width: "100%" }} type="text" value={value || ""} onChange={(e) => handleChange(key, e.target.value)} className="settings-input" />;
  };

  const tabs = [
    { id: "basic", name: "基本设置", icon: "🌐" }, { id: "display", name: "显示设置", icon: "📱" },
    { id: "projects", name: "项目展示", icon: "🚀" },
    { id: "comments", name: "评论设置", icon: "💬" }, { id: "users", name: "用户设置", icon: "👥" },
    { id: "upload", name: "上传设置", icon: "📤" }, { id: "social", name: "作者与社交", icon: "👤" },
    { id: "ai", name: "AI 设置", icon: "🤖" }, { id: "vector", name: "向量搜索", icon: "🔍" },
    { id: "mcp", name: "MCP 设置", icon: "🔌" }, { id: "other", name: "其他设置", icon: "⚙️" },
  ];

  const settingGroups: Record<string, string[]> = {
    basic: ["site_name", "site_description", "site_keywords", "site_logo", "site_favicon"],
    display: ["posts_per_page", "comments_per_page", "excerpt_length"],
    projects: ["projects_enabled", "projects_show_on_home", "projects_home_count", "projects_intro", "projects_nav_label"],
    comments: ["comments_enabled", "comments_moderation", "comments_guest_allowed"],
    users: ["registration_enabled", "default_user_role"],
    upload: ["upload_max_size", "upload_allowed_types"],
    social: ["about_author_name", "about_author_bio", "author_avatar", "about_social_links"],
    ai: [], vector: ["ai_vector_search_enabled", "ai_vector_search_threshold", "ai_vector_search_weight_title", "ai_vector_search_weight_content", "ai_vector_search_weight_excerpt"],
    mcp: ["mcp_enabled", "mcp_allow_user_select"], other: ["footer_text", "analytics_code"],
  };

  const settingLabels: Record<string, string> = {
    site_name: "网站名称", site_description: "网站描述", site_keywords: "网站关键词", site_logo: "网站Logo URL", site_favicon: "网站Favicon URL",
    posts_per_page: "每页文章数", comments_per_page: "每页评论数", excerpt_length: "摘要字数",
    comments_enabled: "开启评论", comments_moderation: "评论需审核", comments_guest_allowed: "允许游客评论",
    registration_enabled: "开放注册", default_user_role: "默认用户角色", upload_max_size: "最大上传大小(MB)", upload_allowed_types: "允许的文件类型",
    author_name: "作者名称", author_bio: "作者简介", author_avatar: "作者头像 URL", about_social_links: "社交链接",
    footer_text: "页脚文字", analytics_code: "统计代码",
    projects_enabled: "启用项目展示", projects_show_on_home: "首页显示精选项目",
    projects_home_count: "首页项目数量", projects_intro: "项目页介绍文字", projects_nav_label: "导航栏项目名称",
    ai_enabled: "启用AI功能", ai_provider: "AI服务商", ai_api_key: "API密钥", ai_api_base_url: "API地址(可选)", ai_model: "模型名称",
    ai_model_light: "轻量模型名称", ai_embedding_model: "Embedding模型名称", ai_assistant_enabled: "启用AI助手", ai_assistant_name: "助手名称",
    ai_assistant_welcome: "欢迎语", ai_assistant_system_prompt: "系统提示词",
    ai_vector_search_enabled: "启用向量搜索", ai_vector_search_threshold: "相似度阈值 (0-1)",
    ai_vector_search_weight_title: "标题权重", ai_vector_search_weight_content: "内容权重", ai_vector_search_weight_excerpt: "摘要权重",
    mcp_enabled: "启用MCP功能", mcp_allow_user_select: "允许用户选择MCP服务器",
  };

  if (loading) return (<AdminLayout><div className="settings-loading"><p>加载中...</p></div></AdminLayout>);

  return (
    <AdminLayout>
      <style dangerouslySetInnerHTML={{ __html: settingsStyles }} />
      <div className="settings-page">
        <div className="page-header">
          <h1 className="page-title">系统设置</h1>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存设置"}</button>
        </div>
        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
        <div className="settings-container">
          <div className="settings-tabs">
            {tabs.map((tab) => (<button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}><span className="tab-icon">{tab.icon}</span><span className="tab-name">{tab.name}</span></button>))}
          </div>
          <div className={`settings-content ${activeTab === "vector" || activeTab === "mcp" ? "grid-layout" : ""}`}>
            {activeTab === "ai" ? (<AISettings settings={settings} onChange={handleChange} />)
              : activeTab === "vector" ? (<VectorManager />)
              : activeTab === "mcp" ? (<MCPManager settings={settings} details={details} onChange={handleChange} />)
              : (settingGroups[activeTab]?.map((key) => {
                  const detail = details[key]; if (!detail) return null;
                  return (<div key={key} className="setting-item"><div className="setting-label"><span className="label-text">{settingLabels[key] || key}</span><span className="label-desc">{detail.description}</span></div><div className="setting-control">{renderInput(key, detail)}</div></div>);
                }))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
