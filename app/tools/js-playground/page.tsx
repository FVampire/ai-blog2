import type { Metadata } from 'next';
import JsPlayground from './JsPlayground';
export const metadata: Metadata = { title: 'JS 代码编辑器 - 工具箱', description: '使用 CodeMirror 编辑，在无同源权限 iframe 的独立 Worker 中运行 JavaScript。' };
export default function Page() { return <JsPlayground />; }
