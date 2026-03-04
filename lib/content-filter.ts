/**
 * 内容过滤工具 - 违禁词检测
 */

// 违禁词列表 - 可以根据需要扩展
const BANNED_WORDS = [
  // 政治敏感词
  '习近平', '政变', '革命', '民运', '六四', '法轮功', '达赖',

  // 暴力相关
  '杀人', '自杀', '炸弹', '恐怖袭击', '血腥', '屠杀',

  // 色情相关
  '色情', '黄色', '淫秽', '成人网站', 'AV', '裸体',

  // 赌博相关
  '赌博', '博彩', '赌场', '六合彩', '赌球', '赌钱',

  // 毒品相关
  '毒品', '大麻', '海洛因', '冰毒', '吸毒',

  // 欺诈相关
  '诈骗', '传销', '骗钱', '钓鱼网站', '假证',

  // 侮辱性语言
  '傻逼', '妈的', '操你', '狗日', '贱人', '婊子', '去死',

  // 其他敏感词
  '病毒', '疫情阴谋', '反华', '台独', '港独',
];

// 敏感词列表 - 检测到会标记，但不一定拦截（可根据业务需求调整）
const SENSITIVE_WORDS = [
  '翻墙', 'VPN', '代理服务器', '暗网',
  '枪支', '武器', '弹药',
];

interface FilterResult {
  hasViolation: boolean;
  matchedWords: string[];
  isSensitive: boolean;
  sensitiveWords: string[];
}

/**
 * 检测内容是否包含违禁词或敏感词
 * @param content 要检测的内容
 * @returns FilterResult 检测结果
 */
export function checkContent(content: string): FilterResult {
  const lowerContent = content.toLowerCase();
  const matchedWords: string[] = [];
  const sensitiveWords: string[] = [];

  // 检测违禁词
  for (const word of BANNED_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      matchedWords.push(word);
    }
  }

  // 检测敏感词
  for (const word of SENSITIVE_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      sensitiveWords.push(word);
    }
  }

  return {
    hasViolation: matchedWords.length > 0,
    matchedWords,
    isSensitive: sensitiveWords.length > 0,
    sensitiveWords,
  };
}

/**
 * 判断内容是否需要人工审核
 * @param content 要检测的内容
 * @returns boolean 是否需要审核
 */
export function needsModeration(content: string): boolean {
  const result = checkContent(content);
  // 如果有违禁词或敏感词，都需要人工审核
  return result.hasViolation || result.isSensitive;
}

/**
 * 获取过滤原因
 * @param content 要检测的内容
 * @returns string 过滤原因
 */
export function getFilterReason(content: string): string {
  const result = checkContent(content);

  if (result.hasViolation) {
    return `检测到违禁词：${result.matchedWords.join(', ')}`;
  }

  if (result.isSensitive) {
    return `检测到敏感词：${result.sensitiveWords.join(', ')}，需要人工审核`;
  }

  return '内容正常';
}

/**
 * 添加自定义违禁词
 * @param words 要添加的违禁词数组
 */
export function addBannedWords(words: string[]): void {
  BANNED_WORDS.push(...words);
}

/**
 * 添加自定义敏感词
 * @param words 要添加的敏感词数组
 */
export function addSensitiveWords(words: string[]): void {
  SENSITIVE_WORDS.push(...words);
}
