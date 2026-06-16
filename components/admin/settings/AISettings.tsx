'use client';

import React from "react";

interface AISettingsProps {
  settings: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const AISettings: React.FC<AISettingsProps> = ({ settings, onChange }) => {
  const settingLabels: Record<string, string> = {
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
  };

  // 渲染开关
  const renderToggle = (key: string) => (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={settings[key] === true}
        onChange={(e) => onChange(key, e.target.checked)}
      />
      <span className="toggle-slider"></span>
    </label>
  );

  // 渲染 AI 服务商下拉
  const renderProviderSelect = () => (
    <select
      value={settings["ai_provider"] || "openai"}
      onChange={(e) => onChange("ai_provider", e.target.value)}
      className="settings-select"
    >
      <option value="openai">OpenAI (GPT-4/GPT-3.5)</option>
      <option value="anthropic">Anthropic (Claude)</option>
      <option value="deepseek">DeepSeek</option>
      <option value="moonshot">Moonshot (月之暗面)</option>
      <option value="qwen">通义千问</option>
      <option value="other">其他 (OpenAI 兼容)</option>
    </select>
  );

  return (
    <div className="ai-settings">
      {/* Section 1: 通用设置 */}
      <div className="setting-group">
        <div className="group-header">
          <h2 className="group-title">通用设置</h2>
          <p className="group-desc">控制 AI 功能的全局开关。</p>
        </div>
        <div className="group-content">
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_enabled"]}</span>
              <span className="label-desc">开启后，系统将允许使用 AI 相关的所有功能模块。</span>
            </div>
            <div className="setting-control">{renderToggle("ai_enabled")}</div>
          </div>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_assistant_enabled"]}</span>
              <span className="label-desc">在界面右下角显示悬浮 AI 助手聊天窗口。</span>
            </div>
            <div className="setting-control">{renderToggle("ai_assistant_enabled")}</div>
          </div>
        </div>
      </div>

      {/* Section 2: API 配置 */}
      <div className="setting-group">
        <div className="group-header">
          <h2 className="group-title">API 配置</h2>
          <p className="group-desc">连接第三方 AI 服务商的必要参数。</p>
        </div>
        <div className="group-content">
          <div className="setting-item full-width">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_provider"]}</span>
            </div>
            <div className="setting-control">{renderProviderSelect()}</div>
          </div>
          <div className="setting-item full-width">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_api_key"]}</span>
            </div>
            <div className="setting-control">
              <input
                type="password"
                value={settings["ai_api_key"] || ""}
                onChange={(e) => onChange("ai_api_key", e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                className="settings-input"
              />
            </div>
          </div>
          <div className="setting-item full-width">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_api_base_url"]}</span>
            </div>
            <div className="setting-control">
              <input
                type="text"
                value={settings["ai_api_base_url"] || ""}
                onChange={(e) => onChange("ai_api_base_url", e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="settings-input"
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_model"]}</span>
            </div>
            <div className="setting-control">
              <input
                type="text"
                value={settings["ai_model"] || ""}
                onChange={(e) => onChange("ai_model", e.target.value)}
                placeholder="gpt-4-turbo"
                className="settings-input"
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_model_light"]}</span>
            </div>
            <div className="setting-control">
              <input
                type="text"
                value={settings["ai_model_light"] || ""}
                onChange={(e) => onChange("ai_model_light", e.target.value)}
                placeholder="gpt-3.5-turbo"
                className="settings-input"
              />
            </div>
          </div>
          <div className="setting-item full-width">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_embedding_model"]}</span>
            </div>
            <div className="setting-control">
              <input
                type="text"
                value={settings["ai_embedding_model"] || ""}
                onChange={(e) => onChange("ai_embedding_model", e.target.value)}
                placeholder="text-embedding-ada-002"
                className="settings-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: AI 助手配置 */}
      <div className="setting-group">
        <div className="group-header">
          <h2 className="group-title">AI 助手配置</h2>
          <p className="group-desc">自定义助手的行为和形象。</p>
        </div>
        <div className="group-content">
          <div className="setting-item full-width">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_assistant_name"]}</span>
            </div>
            <div className="setting-control">
              <input
                type="text"
                value={settings["ai_assistant_name"] || ""}
                onChange={(e) => onChange("ai_assistant_name", e.target.value)}
                placeholder="智能小助手"
                className="settings-input"
              />
            </div>
          </div>
          <div className="setting-item full-width">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_assistant_welcome"]}</span>
            </div>
            <div className="setting-control">
              <textarea
                value={settings["ai_assistant_welcome"] || ""}
                onChange={(e) => onChange("ai_assistant_welcome", e.target.value)}
                placeholder="你好！我是你的 AI 助手，有什么可以帮你的吗？"
                rows={2}
                className="settings-textarea"
              />
            </div>
          </div>
          <div className="setting-item full-width">
            <div className="setting-label">
              <span className="label-text">{settingLabels["ai_assistant_system_prompt"]}</span>
            </div>
            <div className="setting-control">
              <textarea
                value={settings["ai_assistant_system_prompt"] || ""}
                onChange={(e) => onChange("ai_assistant_system_prompt", e.target.value)}
                placeholder="你是一个乐于助人的助手..."
                rows={4}
                className="settings-textarea"
              />
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ai-settings {
          width: 100%;
        }

        .setting-group {
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .group-header {
          padding: 16px 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .group-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .group-desc {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        .group-content {
          padding: 20px;
          background: white;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .setting-item:first-child {
          padding-top: 0;
        }

        .setting-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .setting-item.full-width {
          flex-direction: column;
          gap: 8px;
        }

        .setting-label {
          flex: 1;
        }

        .label-text {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 4px;
        }

        .label-desc {
          display: block;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.5;
        }

        .setting-control {
          flex-shrink: 0;
        }

        .setting-item.full-width .setting-control {
          width: 100%;
        }

        .settings-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .settings-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .settings-textarea {
          width: 100%;
          min-width: 0;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
          font-family: inherit;
        }

        .settings-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .settings-select {
          width: 100%;
          min-width: 200px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .settings-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Toggle Switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #d1d5db;
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: #3b82f6;
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
      `}} />
    </div>
  );
};

export default AISettings;
