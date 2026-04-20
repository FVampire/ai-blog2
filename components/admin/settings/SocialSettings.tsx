import React, { useState, useEffect } from "react";

interface SocialLink {
  platform: string;
  name: string;
  url: string;
}

interface SocialSettingsProps {
  initialLinks?: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

const SocialSettings: React.FC<SocialSettingsProps> = ({ initialLinks = [], onChange }) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialLinks);
  const [newSocialLink, setNewSocialLink] = useState<SocialLink>({ platform: "", name: "", url: "" });

  useEffect(() => {
    if (initialLinks.length > 0) {
      setSocialLinks(initialLinks);
    }
  }, [initialLinks]);

  const handleAddSocialLink = () => {
    if (newSocialLink.platform.trim() && newSocialLink.name.trim() && newSocialLink.url.trim()) {
      const updated = [...socialLinks, { ...newSocialLink }];
      setSocialLinks(updated);
      onChange(updated);
      setNewSocialLink({ platform: "", name: "", url: "" });
    }
  };

  const handleRemoveSocialLink = (index: number) => {
    const updated = socialLinks.filter((_, i) => i !== index);
    setSocialLinks(updated);
    onChange(updated);
  };

  const handleUpdateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
    onChange(updated);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        {socialLinks.map((link, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row gap-2 items-stretch md:items-center mb-2 p-2 bg-gray-50 rounded-md border border-gray-200"
          >
            <input
              type="text"
              value={link.platform}
              onChange={(e) => handleUpdateSocialLink(index, "platform", e.target.value)}
              placeholder="平台标识 (如: github)"
              className="flex-1 min-w-0 md:min-w-[100px] px-2.5 py-1.5 border border-gray-300 rounded text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
            />
            <input
              type="text"
              value={link.name}
              onChange={(e) => handleUpdateSocialLink(index, "name", e.target.value)}
              placeholder="显示名称 (如: GitHub)"
              className="flex-1 min-w-0 md:min-w-[100px] px-2.5 py-1.5 border border-gray-300 rounded text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
            />
            <input
              type="text"
              value={link.url}
              onChange={(e) => handleUpdateSocialLink(index, "url", e.target.value)}
              placeholder="链接地址"
              className="flex-[2] min-w-0 md:min-w-[200px] px-2.5 py-1.5 border border-gray-300 rounded text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => handleRemoveSocialLink(index)}
              className="px-2.5 py-1.5 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
              title="删除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center p-3 bg-green-50 rounded-md border border-dashed border-green-300">
        <input
          type="text"
          value={newSocialLink.platform}
          onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
          placeholder="平台标识"
          className="flex-1 min-w-0 md:min-w-[100px] px-2.5 py-1.5 border border-gray-300 rounded text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
        />
        <input
          type="text"
          value={newSocialLink.name}
          onChange={(e) => setNewSocialLink({ ...newSocialLink, name: e.target.value })}
          placeholder="显示名称"
          className="flex-1 min-w-0 md:min-w-[100px] px-2.5 py-1.5 border border-gray-300 rounded text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
        />
        <input
          type="text"
          value={newSocialLink.url}
          onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
          placeholder="链接地址"
          className="flex-[2] min-w-0 md:min-w-[200px] px-2.5 py-1.5 border border-gray-300 rounded text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleAddSocialLink}
          className="px-4 py-1.5 bg-green-500 text-white rounded text-[13px] font-medium whitespace-nowrap hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          disabled={!newSocialLink.platform.trim() || !newSocialLink.name.trim() || !newSocialLink.url.trim()}
        >
          添加
        </button>
      </div>
    </div>
  );
};

export default SocialSettings;
