import type { Metadata } from 'next';
import MarkdownTool from './MarkdownTool';
export const metadata: Metadata = { title: 'Markdown 转 HTML - 工具箱', description: 'GFM、代码高亮、普通与霓虹主题，以及自包含和内联样式 HTML 导出。' };
export default function Page() { return <MarkdownTool />; }
