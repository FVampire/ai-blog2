import type { Metadata } from 'next';
import McpExplorer from './McpExplorer';
export const metadata: Metadata = { title: 'MCP 注册表查询 - 工具箱', description: '检索官方 MCP Registry，查看传输方式并生成客户端配置。' };
export default function Page() { return <McpExplorer />; }
