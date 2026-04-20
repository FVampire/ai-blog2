import { Command, KnowledgeBase } from './types';

// 支持的命令列表
export const AVAILABLE_COMMANDS: Command[] = [
  { name: '/clear', description: '清空当前对话上下文', example: '/clear' },
  { name: '/help', description: '显示所有可用命令', example: '/help' },
  { name: '/mcp', description: '切换 MCP 工具开关', example: '/mcp' },
  { name: '/kb', description: '切换知识库选择面板', example: '/kb' },
];

// 知识库列表
export const KNOWLEDGE_BASES: KnowledgeBase[] = [
  { id: '', name: '默认知识库', description: '使用博客文章作为知识来源' },
];

// 获取文章建议问题
export const getArticleSuggestions = (article: any): string[] => {
  const suggestions = [
    `这篇文章的主要内容是什么？`,
    `能帮我总结一下《${article.title}》吗？`,
    `这篇文章有哪些关键点？`,
  ];

  if (article.tags && article.tags.length > 0) {
    suggestions.push(`${article.tags[0].name}相关的内容还有哪些？`);
  }

  return suggestions.slice(0, 3);
};
