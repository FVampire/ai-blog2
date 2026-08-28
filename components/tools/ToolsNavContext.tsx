'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { type ToolCategory, type ToolMeta } from '@/lib/tools/registry';

export type ToolsNavCategory = 'all' | ToolCategory;

interface ToolsNavValue {
  tools: ToolMeta[];
  query: string;
  setQuery: (value: string) => void;
  category: ToolsNavCategory;
  setCategory: (value: ToolsNavCategory) => void;
}

const ToolsNavContext = createContext<ToolsNavValue | null>(null);

export function toolMatchesQuery(tool: ToolMeta, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [tool.name, tool.enName, tool.tagline, ...tool.tags].join(' ').toLowerCase().includes(normalized);
}

export function ToolsNavProvider({ tools, children }: { tools: ToolMeta[]; children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolsNavCategory>('all');
  const value = useMemo(
    () => ({ tools, query, setQuery, category, setCategory }),
    [tools, query, category],
  );

  return <ToolsNavContext.Provider value={value}>{children}</ToolsNavContext.Provider>;
}

export function useToolsNav() {
  const value = useContext(ToolsNavContext);
  if (!value) throw new Error('useToolsNav must be used within ToolsNavProvider');
  return value;
}
