import React from 'react';

export type AdminIconName =
  | 'dashboard' | 'posts' | 'categories' | 'tags' | 'media' | 'comments'
  | 'projects' | 'settings' | 'users' | 'integrations' | 'agent' | 'tools' | 'home' | 'menu';

const paths: Record<AdminIconName, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  posts: <><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></>,
  categories: <><path d="M3 6h7l2 2h9v11H3z"/><path d="M3 6V4h7l2 2"/></>,
  tags: <><path d="M20 13 13 20 4 11V4h7z"/><circle cx="8.5" cy="8.5" r="1.2"/></>,
  media: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/></>,
  comments: <><path d="M21 12a8 8 0 0 1-8 8H6l-3 2v-6a8 8 0 1 1 18-4Z"/><path d="M8 11h8M8 15h5"/></>,
  projects: <><path d="M8 3h8l2 4h3v13H3V7h3z"/><path d="M8 3v4h8V3M8 12h8M12 9v6"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5"/></>,
  integrations: <><path d="M8 3v4M16 3v4M5 7h14v4a7 7 0 0 1-7 7 7 7 0 0 1-7-7zM12 18v3"/></>,
  agent: <><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 3v4M9 3h6M8 12h.01M16 12h.01M8 16h8"/></>,
  tools: <><path d="m14.7 6.3 3-3a4 4 0 0 1-5 5L6 15l-3 6 6-3 6.7-6.7a4 4 0 0 1 5-5l-3 3z"/><path d="m5.5 16.5 2 2"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
};

export default function AdminIcon({ name, size = 19 }: { name: AdminIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
