'use client';

import React, { useState } from "react";

interface SocialLink {
  platform: string;
  name: string;
  url: string;
}

interface SocialLinksEditorProps {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

const SocialLinksEditor: React.FC<SocialLinksEditorProps> = ({ links, onChange }) => {
  const [newLink, setNewLink] = useState<SocialLink>({ platform: "", name: "", url: "" });

  const handleAdd = () => {
    if (newLink.platform.trim() && newLink.name.trim() && newLink.url.trim()) {
      onChange([...links, { ...newLink }]);
      setNewLink({ platform: "", name: "", url: "" });
    }
  };

  const handleRemove = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="social-links-editor">
      <div className="social-links-list">
        {links.map((link, index) => (
          <div key={index} className="social-link-item">
            <input
              type="text"
              value={link.platform}
              onChange={(e) => handleUpdate(index, "platform", e.target.value)}
              placeholder="平台标识 (如: github)"
              className="social-link-input"
            />
            <input
              type="text"
              value={link.name}
              onChange={(e) => handleUpdate(index, "name", e.target.value)}
              placeholder="显示名称 (如: GitHub)"
              className="social-link-input"
            />
            <input
              type="text"
              value={link.url}
              onChange={(e) => handleUpdate(index, "url", e.target.value)}
              placeholder="链接地址"
              className="social-link-input url"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="social-link-remove"
              title="删除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="social-link-add">
        <input
          type="text"
          value={newLink.platform}
          onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
          placeholder="平台标识"
          className="social-link-input"
        />
        <input
          type="text"
          value={newLink.name}
          onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
          placeholder="显示名称"
          className="social-link-input"
        />
        <input
          type="text"
          value={newLink.url}
          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
          placeholder="链接地址"
          className="social-link-input url"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="social-link-add-btn"
          disabled={!newLink.platform.trim() || !newLink.name.trim() || !newLink.url.trim()}
        >
          添加
        </button>
      </div>

    </div>
  );
};

export default SocialLinksEditor;
