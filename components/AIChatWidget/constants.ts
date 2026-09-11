import type { Command } from "../../types/ai-chat";

// 支持的命令列表
export const AVAILABLE_COMMANDS: Command[] = [
  { name: "/clear", description: "清空当前对话上下文", example: "/clear" },
  { name: "/help", description: "显示所有可用命令", example: "/help" },
  { name: "/mcp", description: "切换 MCP 工具开关", example: "/mcp" },
  { name: "/kb", description: "切换知识库选择面板", example: "/kb" },
];

// 获取文章建议问题
export const getArticleSuggestions = (article: { title: string }): string[] => {
  const suggestions = [
    `这篇文章的主要内容是什么？`,
    `能帮我总结一下《${article.title}》吗？`,
    `这篇文章有哪些关键点？`,
  ];

  return suggestions;
};
