import type { Metadata } from 'next';
import ToolCatalog from '@/components/tools/ToolCatalog';
import styles from './tools.module.css';

export const metadata: Metadata = {
  title: 'Tools - 五月的火',
  description: '编码转换、文本处理、时间日期、图像与开发辅助在线工具集合。',
};

export default function ToolsPage() {
  return (
    <main className={styles.page}>
      <ToolCatalog />
    </main>
  );
}
