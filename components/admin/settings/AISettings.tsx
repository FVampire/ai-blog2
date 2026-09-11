"use client";
import React, { useState } from "react";
import { authJson } from "../authFetch";
interface Props {
  settings: Record<string, any>;
  onChange: (key: string, value: any) => void;
}
export default function AISettings({ settings, onChange }: Props) {
  const [testing, setTesting] = useState("");
  const [result, setResult] = useState("");
  const [serverId, setServerId] = useState("");
  const [toolsDraft, setToolsDraft] = useState<string | null>(null);
  const [toolsError, setToolsError] = useState("");
  const field = (key: string, label: string, type = "text", hint = "") => (
    <div className="setting-item full-width" key={key}>
      <label htmlFor={key} className="setting-label">
        <span className="label-text">{label}</span>
        {hint && <span className="label-desc">{hint}</span>}
      </label>
      <div className="setting-control">
        {type === "boolean" ? (
          <input
            id={key}
            type="checkbox"
            checked={settings[key] === true}
            onChange={(e) => onChange(key, e.target.checked)}
          />
        ) : type === "textarea" ? (
          <textarea
            id={key}
            className="settings-textarea"
            value={settings[key] || ""}
            onChange={(e) => onChange(key, e.target.value)}
            rows={3}
          />
        ) : (
          <input
            id={key}
            type={type}
            step={type === "number" ? "any" : undefined}
            className="settings-input"
            autoComplete={type === "password" ? "new-password" : undefined}
            value={settings[key] ?? ""}
            placeholder={
              type === "password" && settings[key] === null
                ? "密钥已隐藏；不修改则保留，输入新值可替换"
                : ""
            }
            onChange={(e) =>
              onChange(
                key,
                type === "number" ? Number(e.target.value) : e.target.value,
              )
            }
          />
        )}
      </div>
    </div>
  );
  const test = async (kind: string) => {
    setTesting(kind);
    setResult("");
    try {
      const response = await authJson<{ name: string; readOnly: boolean }[]>(
        "/api/admin/ai/test",
        {
          method: "POST",
          body: JSON.stringify({ kind, serverId: Number(serverId) }),
        },
      );
      setResult(
        response.message +
          (Array.isArray(response.data)
            ? "\n" +
              response.data
                .map(
                  (t) =>
                    `${t.name}：${t.readOnly ? "只读，可加入公开白名单" : "不可向访客开放"}`,
                )
                .join("\n")
            : ""),
      );
    } finally {
      setTesting("");
    }
  };
  return (
    <div className="ai-settings">
      <div className="setting-group">
        <div className="group-header">
          <h2 className="group-title">模型与访问</h2>
          <p className="group-desc">
            先保存配置，再测试连接。测试模型和向量服务会产生少量调用费用。
          </p>
        </div>
        <div className="group-content">
          {field("ai_enabled", "启用 AI 功能", "boolean")}
          {field("ai_assistant_enabled", "启用公开聊天助手", "boolean")}
          <div className="setting-item">
            <label htmlFor="ai_provider">服务商</label>
            <select
              id="ai_provider"
              className="settings-select"
              value={settings.ai_provider || "openai"}
              onChange={(e) => onChange("ai_provider", e.target.value)}
            >
              {[
                ["openai", "OpenAI"],
                ["anthropic", "Anthropic"],
                ["deepseek", "DeepSeek"],
                ["moonshot", "Moonshot"],
                ["qwen", "通义千问"],
                ["other", "其他 OpenAI 兼容接口"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {field("ai_api_key", "API 密钥", "password")}
          {field(
            "ai_api_base_url",
            "API 地址",
            "url",
            "留空使用服务商默认地址；其他兼容接口必须填写。",
          )}
          {field("ai_model", "模型名称")}
          {field(
            "ai_temperature_enabled",
            "发送温度参数（不支持此参数的模型请关闭）",
            "boolean",
          )}
          {field(
            "ai_temperature",
            settings.ai_provider === "anthropic"
              ? "温度（0–1）"
              : "温度（0–2）",
            "number",
          )}
          {field("ai_max_tokens", "最大输出 Token（128–16384）", "number")}
          <button
            type="button"
            className="btn-secondary"
            disabled={!!testing}
            onClick={() => void test("model")}
          >
            测试已保存的模型配置
          </button>
        </div>
      </div>
      <div className="setting-group">
        <div className="group-header">
          <h2 className="group-title">助手内容</h2>
        </div>
        <div className="group-content">
          {field("ai_assistant_name", "助手名称")}
          {field("ai_assistant_avatar", "助手头像 URL")}
          {field("ai_assistant_welcome", "欢迎语", "textarea")}
          {field("ai_assistant_system_prompt", "系统提示词", "textarea")}
        </div>
      </div>
      <div className="setting-group">
        <div className="group-header">
          <h2 className="group-title">全站知识库</h2>
          <p className="group-desc">
            当前文章模式直接读取正文。全站模式需要向量服务和文章索引；更换模型后需在向量管理中重建索引。
          </p>
        </div>
        <div className="group-content">
          {field("ai_vector_search_enabled", "允许全站文章检索", "boolean")}
          {field("ai_embedding_api_key", "Embedding 密钥", "password")}
          {field("ai_embedding_api_base_url", "Embedding API 地址", "url")}
          {field("ai_embedding_model", "Embedding 模型")}
          {field(
            "ai_embedding_dimensions",
            "向量维度（当前索引固定为 1024）",
            "number",
          )}
          {field("ai_vector_search_threshold", "相似度阈值（0–1）", "number")}
          <button
            type="button"
            className="btn-secondary"
            disabled={!!testing}
            onClick={() => void test("embedding")}
          >
            测试已保存的向量配置
          </button>
        </div>
      </div>
      <div className="setting-group">
        <div className="group-header">
          <h2 className="group-title">公开 MCP 工具</h2>
          <p className="group-desc">
            在 MCP
            管理中配置服务器。仅开放白名单内且服务器声明为只读的工具；写入工具不向匿名访客开放。
          </p>
        </div>
        <div className="group-content">
          {field("mcp_enabled", "启用 MCP", "boolean")}
          {field("mcp_allow_user_select", "允许访客选择服务器", "boolean")}
          <label htmlFor="ai_public_mcp_tools">
            工具白名单（服务器 ID → 工具名称数组）
          </label>
          <textarea
            id="ai_public_mcp_tools"
            className="settings-textarea"
            rows={4}
            value={
              toolsDraft ??
              JSON.stringify(settings.ai_public_mcp_tools || {}, null, 2)
            }
            placeholder={'{"1": ["search_articles"]}'}
            onChange={(e) => {
              setToolsDraft(e.target.value);
              try {
                const value = JSON.parse(e.target.value);
                if (
                  !value ||
                  Array.isArray(value) ||
                  typeof value !== "object" ||
                  Object.entries(value).some(
                    ([key, names]) =>
                      !/^\d+$/.test(key) ||
                      !Array.isArray(names) ||
                      names.some((name) => typeof name !== "string"),
                  )
                )
                  throw new Error();
                onChange("ai_public_mcp_tools", value);
                setToolsError("");
              } catch {
                onChange("ai_public_mcp_tools", e.target.value);
                setToolsError(
                  "请输入有效的服务器 ID 与工具名称数组；无效编辑不会保存。",
                );
              }
            }}
          />
          {toolsError && <p role="alert">{toolsError}</p>}
          <label htmlFor="mcp-test-server">待测试的服务器 ID</label>
          <input
            id="mcp-test-server"
            type="number"
            min={1}
            className="settings-input"
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary"
            disabled={!!testing || !serverId}
            onClick={() => void test("mcp")}
          >
            检测已保存的服务器并列出工具
          </button>
        </div>
      </div>
      {(testing || result) && (
        <pre role="status" style={{ whiteSpace: "pre-wrap" }}>
          {testing ? "连接测试中…" : result}
        </pre>
      )}
    </div>
  );
}
