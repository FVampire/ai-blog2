import React, { useState, useEffect } from "react";
import Head from "next/head";
import AdminLayout from "../../components/admin/AdminLayout";
import VectorManager from "../../components/admin/VectorManager";
import MCPManager from "../../components/admin/MCPManager";
import AISettings from "../../components/admin/settings/AISettings";
import SocialSettings from "../../components/admin/settings/SocialSettings";

interface SettingDetail {
  value: any;
  type: string;
  description: string;
}

type SettingsDetails = Record<string, SettingDetail>;

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [details, setDetails] = useState<SettingsDetails>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("basic");
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; name: string; url: string }>>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data.settings);
        setDetails(data.data.details);
        // 加载社交链接
        if (data.data.settings.about_social_links) {
          setSocialLinks(data.data.settings.about_social_links);
        }
      } else {
        setMessage({ type: "error", text: data.message || "获取设置失败" });
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
      setMessage({ type: "error", text: "获取设置失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSocialLinksChange = (links: Array<{ platform: string; name: string; url: string }>) => {
    setSocialLinks(links);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setMessage({ type: "error", text: "登录已过期，请重新登录" });
        window.location.href = "/admin/login";
        return;
      }

      // 合并社交链接到设置中
      const settingsToSave = {
        ...settings,
        about_social_links: socialLinks,
      };

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "设置已保存" });
      } else {
        setMessage({ type: "error", text: data.message || "保存失败" });
      }
    } catch (error) {
      console.error("Save settings error:", error);
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  // 渲染单个设置项
  const renderSettingItem = (key: string) => {
    const detail = details[key];
    const value = settings[key];

    // 推断类型
    let type = "string";
    if (key.startsWith("ai_") && key.endsWith("_enabled")) {
      type = "boolean";
    } else if (key.includes("_key") || key.includes("password")) {
      type = "password";
    }

    // 创建默认 detail
    const effectiveDetail: SettingDetail = detail || {
      value,
      type,
      description: "",
    };

    return (
      <div key={key} className="flex flex-col py-5 border-b border-gray-100 gap-3 last:border-b-0">
        <div className="w-full">
          <span className="block text-sm font-medium text-gray-900 mb-1.5">{settingLabels[key] || key}</span>
          {effectiveDetail.description && <span className="block text-xs text-gray-500 leading-relaxed">{effectiveDetail.description}</span>}
        </div>
        <div className="w-full">{renderInput(key, effectiveDetail)}</div>
      </div>
    );
  };

  const renderInput = (key: string, detail: SettingDetail) => {
    const { type } = detail;
    const value = settings[key];

    // 社交链接特殊处理
    if (key === "about_social_links") {
      return <SocialSettings initialLinks={socialLinks} onChange={handleSocialLinksChange} />;
    }

    if (type === "boolean") {
      return (
        <label className="relative inline-block w-12 h-6">
          <input type="checkbox" checked={value === true} onChange={(e) => handleChange(key, e.target.checked)} className="opacity-0 w-0 h-0" />
          <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 transition-colors duration-300 rounded-full before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:transition-transform before:duration-300 before:rounded-full peer-checked:bg-blue-500 [input:checked+&]:bg-blue-500 [input:checked+&]:before:translate-x-6"></span>
        </label>
      );
    }

    if (type === "number") {
      return (
        <input
          type="number"
          value={value || ""}
          onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10"
        />
      );
    }

    // AI 服务商下拉选择
    if (key === "ai_provider") {
      return (
        <select
          value={value || "openai"}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white cursor-pointer transition-all focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="deepseek">DeepSeek</option>
          <option value="moonshot">Moonshot (月之暗面)</option>
          <option value="qwen">通义千问</option>
          <option value="other">其他 (OpenAI 兼容)</option>
        </select>
      );
    }

    // API 密钥使用密码输入
    if (key === "ai_api_key") {
      return (
        <input
          type="password"
          value={value || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10"
          placeholder="sk-..."
        />
      );
    }

    // 多行文本
    if (key === "analytics_code" || key === "footer_text" || key === "ai_assistant_system_prompt" || key === "ai_assistant_welcome") {
      return (
        <textarea
          value={value || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm resize-y font-[inherit] transition-all focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10"
          rows={key === "ai_assistant_system_prompt" ? 4 : 3}
        />
      );
    }

    return (
      <input
        style={{ width: "100%" }}
        type="text"
        value={value || ""}
        onChange={(e) => handleChange(key, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10"
      />
    );
  };

  const tabs = [
    { id: "basic", name: "基本设置", icon: "🌐" },
    { id: "display", name: "显示设置", icon: "📱" },
    { id: "comments", name: "评论设置", icon: "💬" },
    { id: "users", name: "用户设置", icon: "👥" },
    { id: "upload", name: "上传设置", icon: "📤" },
    { id: "social", name: "作者与社交", icon: "👤" },
    { id: "ai", name: "AI 设置", icon: "🤖" },
    { id: "vector", name: "向量搜索", icon: "🔍" },
    { id: "mcp", name: "MCP 设置", icon: "🔌" },
    { id: "other", name: "其他设置", icon: "⚙️" },
  ];

  const settingGroups: Record<string, string[]> = {
    basic: ["site_name", "site_description", "site_keywords", "site_logo", "site_favicon"],
    display: ["posts_per_page", "comments_per_page", "excerpt_length"],
    comments: ["comments_enabled", "comments_moderation", "comments_guest_allowed"],
    users: ["registration_enabled", "default_user_role"],
    upload: ["upload_max_size", "upload_allowed_types"],
    social: ["about_author_name", "about_author_bio", "author_avatar", "about_social_links"],
    ai: [], // AI 设置使用自定义渲染
    vector: [
      "ai_vector_search_enabled",
      "ai_vector_search_threshold",
      "ai_vector_search_weight_title",
      "ai_vector_search_weight_content",
      "ai_vector_search_weight_excerpt",
    ],
    mcp: ["mcp_enabled", "mcp_allow_user_select"],
    other: ["footer_text", "analytics_code"],
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
    registration_enabled: "开放注册",
    default_user_role: "默认用户角色",
    upload_max_size: "最大上传大小(MB)",
    upload_allowed_types: "允许的文件类型",
    author_name: "作者名称",
    author_bio: "作者简介",
    author_avatar: "作者头像 URL",
    about_social_links: "社交链接",
    footer_text: "页脚文字",
    analytics_code: "统计代码",
    // AI 设置
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
    // 向量搜索设置
    ai_vector_search_enabled: "启用向量搜索",
    ai_vector_search_threshold: "相似度阈值 (0-1)",
    ai_vector_search_weight_title: "标题权重 (0-1)",
    ai_vector_search_weight_content: "内容权重 (0-1)",
    ai_vector_search_weight_excerpt: "摘要权重 (0-1)",
    // MCP 设置
    mcp_enabled: "启用MCP功能",
    mcp_allow_user_select: "允许用户选择MCP服务器",
  };

  if (loading) {
    return (
      <AdminLayout>
        <Head>
          <title>系统设置 - Blog Admin</title>
        </Head>
        <div className="flex justify-center items-center h-[300px] text-gray-500">
          <p>加载中...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>系统设置 - Blog Admin</title>
      </Head>

      <div className="p-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 m-0">系统设置</h1>
          <button
            className="px-6 py-2.5 bg-blue-500 text-white border-0 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
        </div>

        {message.text && (
          <div
            className={`px-4 py-3 rounded-md mb-5 text-sm ${
              message.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-6 bg-white rounded-lg shadow-sm overflow-hidden w-full">
          {/* 标签导航 */}
          <div className="w-[200px] bg-gray-50 pt-4 pb-0 border-r border-gray-200 flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center w-full px-5 py-3 border-0 bg-transparent cursor-pointer text-sm text-gray-600 text-left transition-all hover:bg-gray-200 hover:text-gray-900 ${
                  activeTab === tab.id ? "bg-white text-blue-500 border-r-2 border-blue-500" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mr-2.5 text-base">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* 设置内容 */}
          <div className="flex-1 p-6 w-full min-w-0">
            {activeTab === "ai" ? (
              <AISettings settings={settings} onChange={handleChange} />
            ) : activeTab === "vector" ? (
              <VectorManager />
            ) : activeTab === "mcp" ? (
              <MCPManager settings={settings} details={details} onChange={handleChange} />
            ) : (
              settingGroups[activeTab]?.map((key) => {
                const detail = details[key];
                if (!detail) return null;

                return (
                  <div key={key} className="flex flex-col py-5 border-b border-gray-100 gap-3 last:border-b-0">
                    <div className="w-full">
                      <span className="block text-sm font-medium text-gray-900 mb-1.5">{settingLabels[key] || key}</span>
                      <span className="block text-xs text-gray-500 leading-relaxed">{detail.description}</span>
                    </div>
                    <div className="w-full">{renderInput(key, detail)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 响应式样式 */}
        <style jsx>{`
          @media (max-width: 768px) {
            .flex.gap-6 {
              flex-direction: column;
            }

            .w-\\[200px\\] {
              width: 100%;
              display: flex;
              overflow-x: auto;
              border-right: none;
              border-bottom: 1px solid #e5e7eb;
            }

            button[class*="flex items-center"] {
              flex-shrink: 0;
              white-space: nowrap;
            }

            button[class*="flex items-center"].bg-white {
              border-right: none;
              border-bottom: 2px solid #3b82f6;
            }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
