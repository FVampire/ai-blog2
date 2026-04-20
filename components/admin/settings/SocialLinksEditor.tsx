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

      <style jsx>{`
        .social-links-editor {
          width: 100%;
        }

        .social-links-list {
          margin-bottom: 16px;
        }

        .social-link-item {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .social-link-input {
          flex: 1;
          min-width: 100px;
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
          transition: border-color 0.2s;
        }

        .social-link-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .social-link-input.url {
          flex: 2;
          min-width: 200px;
        }

        .social-link-remove {
          padding: 6px 10px;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .social-link-remove:hover {
          background: #fecaca;
        }

        .social-link-add {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 12px;
          background: #f0fdf4;
          border-radius: 6px;
          border: 1px dashed #86efac;
        }

        .social-link-add-btn {
          padding: 6px 16px;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .social-link-add-btn:hover:not(:disabled) {
          background: #16a34a;
        }

        .social-link-add-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default SocialLinksEditor;
