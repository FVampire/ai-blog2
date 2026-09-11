"use client";

import { useState } from "react";

import styles from "./SocialSettings.module.css";

interface SocialLink {
  platform: string;
  name: string;
  url: string;
}

interface SocialSettingsProps {
  initialLinks?: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

const emptyLink: SocialLink = { platform: "", name: "", url: "" };
const fields = [
  { key: "platform", label: "平台标识", placeholder: "例如 github" },
  { key: "name", label: "显示名称", placeholder: "例如 GitHub" },
  { key: "url", label: "链接地址", placeholder: "https://github.com/username" },
] as const;

export default function SocialSettings({
  initialLinks = [],
  onChange,
}: SocialSettingsProps) {
  const [newLink, setNewLink] = useState<SocialLink>(emptyLink);
  const canAdd = fields.every(({ key }) => newLink[key].trim());

  const addLink = () => {
    if (!canAdd) return;
    onChange([
      ...initialLinks,
      {
        platform: newLink.platform.trim(),
        name: newLink.name.trim(),
        url: newLink.url.trim(),
      },
    ]);
    setNewLink(emptyLink);
  };

  const renderFields = (
    link: SocialLink,
    update: (field: keyof SocialLink, value: string) => void,
  ) =>
    fields.map(({ key, label, placeholder }) => (
      <label
        key={key}
        className={[styles.field, key === "url" ? styles.url : ""].join(" ")}
      >
        <span>{label}</span>
        <input
          type={key === "url" ? "url" : "text"}
          value={link[key]}
          onChange={(event) => update(key, event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
        />
      </label>
    ));

  return (
    <div className={styles.editor}>
      <div className={styles.heading}>
        <span>已添加 {initialLinks.length} 个链接</span>
        <span>修改后点击页面顶部「保存设置」生效</span>
      </div>
      <div className={styles.list}>
        {initialLinks.length === 0 && (
          <p className={styles.empty}>
            暂无社交链接，在下方添加你的第一个平台。
          </p>
        )}
        {initialLinks.map((link, index) => (
          <div
            className={styles.card}
            key={index}
            role="group"
            aria-label={"社交链接 " + (index + 1)}
          >
            <div className={styles.cardHeader}>
              <strong>
                <span className={styles.number}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {link.name || "未命名链接"}
              </strong>
              <button
                type="button"
                className={styles.remove}
                aria-label={
                  "删除链接 " + (index + 1) + "：" + (link.name || "未命名链接")
                }
                onClick={() =>
                  onChange(initialLinks.filter((_, i) => i !== index))
                }
              >
                删除
              </button>
            </div>
            <div className={styles.fields}>
              {renderFields(link, (field, value) =>
                onChange(
                  initialLinks.map((item, i) =>
                    i === index ? { ...item, [field]: value } : item,
                  ),
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      <div
        className={[styles.card, styles.addCard].join(" ")}
        role="group"
        aria-label="添加社交链接"
      >
        <div className={styles.cardHeader}>
          <strong>添加新链接</strong>
          <span>填写平台、名称和完整地址</span>
        </div>
        <div className={styles.fields}>
          {renderFields(newLink, (field, value) =>
            setNewLink({ ...newLink, [field]: value }),
          )}
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.add}
            onClick={addLink}
            disabled={!canAdd}
          >
            ＋ 添加链接
          </button>
        </div>
      </div>
    </div>
  );
}
