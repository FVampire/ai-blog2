'use client';

import type { ReactNode } from 'react';
import type { ToolMeta } from '@/lib/tools/registry';
import { ToolsNavProvider } from './ToolsNavContext';
import ToolsSidebar from './ToolsSidebar';
import styles from './tools-workspace.module.css';

export default function ToolsWorkspace({ tools, children }: { tools: ToolMeta[]; children: ReactNode }) {
  return (
    <ToolsNavProvider tools={tools}>
      <div className={styles.workspace}>
        <ToolsSidebar />
        <div className={styles.content}>{children}</div>
      </div>
    </ToolsNavProvider>
  );
}
