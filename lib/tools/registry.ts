export type ToolCategory = 'encode' | 'text' | 'datetime' | 'media' | 'dev' | 'ai';
export type ToolStatus = 'stable' | 'beta' | 'planned';
export type ToolExecutionMode = 'local' | 'server' | 'proxy' | 'hybrid';

export interface ToolExecutionMeta {
  mode: ToolExecutionMode;
  label: string;
  note: string;
}

export interface DataSourceMeta {
  provider: string;
  providerUrl: string;
  docsUrl: string;
  endpoints: string[];
  auth: string;
  license: string;
  attribution?: string;
  rateLimit?: string;
  integration: string;
}

export interface ToolMeta {
  slug: string;
  name: string;
  enName: string;
  tagline: string;
  description: string;
  category: ToolCategory;
  tags: string[];
  status: ToolStatus;
  icon: string;
  accent: string;
  dataSource?: DataSourceMeta;
  plannedNote?: string;
  execution: ToolExecutionMeta;
}

export const CATEGORIES: { key: ToolCategory; name: string; desc: string }[] = [
  { key: 'encode', name: '编码转换', desc: '格式互转、编解码、序列化' },
  { key: 'text', name: '文本处理', desc: '文本清洗、对比、生成' },
  { key: 'datetime', name: '时间日期', desc: '时间戳、时区、定时表达式' },
  { key: 'media', name: '颜色与图像', desc: '取色、压缩、格式转换' },
  { key: 'dev', name: '开发辅助', desc: '哈希、正则、代码运行' },
  { key: 'ai', name: 'AI 与数据', desc: '模型生态、外部数据源' },
];

const tool = (
  slug: string, name: string, enName: string, tagline: string,
  category: ToolCategory, icon: string, tags: string[],
  status: ToolStatus = 'stable', plannedNote?: string,
): ToolMeta => ({
  slug, name, enName, tagline, description: tagline, category, tags, status, icon,
  accent: {
    encode: '#00b8d9', text: '#7c5cff', datetime: '#ff8a3d',
    media: '#ec4899', dev: '#15a36d', ai: '#3b82f6',
  }[category],
  execution: { mode: 'local', label: '浏览器本地处理', note: '输入不会上传到本站服务器。' },
  plannedNote,
});

export const TOOLS: ToolMeta[] = [
  tool('json-formatter', 'JSON 格式化', 'JSON Formatter', '格式化、压缩并定位 JSON 语法错误', 'encode', '{ }', ['JSON', '格式化', '校验']),
  tool('json-to-ts', 'JSON 转 TypeScript', 'JSON to TypeScript', '从 JSON 数据递归推断 TypeScript 类型', 'encode', 'TS', ['JSON', 'TypeScript', '类型']),
  tool('base64', 'Base64 编解码', 'Base64 Codec', '可靠处理中文文本的 Base64 编码与解码', 'encode', '64', ['Base64', '编码', '中文']),
  tool('url-tools', 'URL 工具', 'URL Toolkit', 'URL 编解码与查询参数解析', 'encode', '↗', ['URL', 'encodeURIComponent', '参数']),
  tool('radix', '进制转换', 'Radix Converter', '2–36 进制整数互转', 'encode', '01', ['二进制', '十六进制', '进制']),
  tool('html-entity', 'HTML 实体编解码', 'HTML Entity Codec', '转义或还原 HTML 特殊字符', 'encode', '&;', ['HTML', '实体', '转义']),
  tool('jwt-decoder', 'JWT 解码', 'JWT Decoder', '查看 JWT header 与 payload（不验证签名）', 'encode', 'JWT', ['JWT', 'Token', '解码']),
  tool('csv-json', 'CSV 与 JSON 互转', 'CSV ↔ JSON', '处理引号、逗号与换行的双向转换', 'encode', 'CSV', ['CSV', 'JSON', '表格']),
  tool('unicode', 'Unicode 工具', 'Unicode Inspector', '查看字符码点或生成 Unicode 转义', 'encode', 'U+', ['Unicode', 'Emoji', '转义']),
  { ...tool('yaml-json', 'YAML 与 JSON 互转', 'YAML ↔ JSON', '在服务端完成 YAML 和 JSON 双向转换', 'encode', 'YML', ['YAML', 'JSON']), execution: { mode: 'server', label: '站内服务端处理', note: '输入会发送到本站 API，处理后立即返回，不写入数据库。' } },

  tool('markdown-to-html', 'Markdown 转 HTML', 'Markdown to HTML', '实时预览，提供普通与霓虹主题及多种导出', 'text', 'MD', ['Markdown', 'HTML', '导出'], 'beta'),
  tool('case-converter', '命名风格转换', 'Case Converter', 'camel、snake、kebab、Pascal 等风格互转', 'text', 'Aa', ['camelCase', 'snake_case', '命名']),
  tool('text-ops', '文本行处理', 'Text Operations', '排序、去重、清空行、反转与编号', 'text', '≡', ['文本', '去重', '排序']),
  tool('word-count', '字数统计', 'Word Counter', '统计中英文、行数并估算阅读时长', 'text', '123', ['字数', '阅读时长', '统计']),
  tool('text-diff', '文本 Diff', 'Text Diff', '逐行对比两段文本并高亮差异', 'text', '±', ['Diff', '对比', '文本']),
  tool('lorem', '假文生成', 'Lorem Generator', '生成中文占位文或 Lorem Ipsum', 'text', '¶', ['Lorem', '占位文字', '生成']),
  tool('zh-convert', '简繁转换', 'Chinese Converter', '简体与繁体中文互转', 'text', '简', ['中文', '繁体'], 'planned', 'OpenCC 词库约 1 MB，待安排按需加载。'),
  tool('pinyin', '汉字转拼音', 'Pinyin Converter', '将汉字转换为带音调或无音调拼音', 'text', 'Pīn', ['拼音', '中文'], 'planned', '需要评估 pinyin-pro 的体积与准确率。'),
  { ...tool('code-format', '代码格式化', 'Code Formatter', '在服务端使用 Prettier 格式化常用前端代码', 'text', '</>', ['Prettier', '格式化']), execution: { mode: 'server', label: '站内服务端处理', note: '输入会发送到本站 API，处理后立即返回，不写入数据库。' } },
  { ...tool('sql-format', 'SQL 格式化', 'SQL Formatter', '在服务端格式化多种 SQL 方言', 'text', 'SQL', ['SQL', '格式化']), execution: { mode: 'server', label: '站内服务端处理', note: '输入会发送到本站 API，处理后立即返回，不写入数据库。' } },

  tool('timestamp', '时间戳转换', 'Timestamp Converter', 'Unix 秒/毫秒与本地时间双向转换', 'datetime', '⌚', ['Unix', '时间戳', '日期']),
  tool('cron', 'Cron 表达式解释', 'Cron Explorer', '解释五段 Cron 并预览后续执行时间', 'datetime', '✳', ['Cron', '定时任务']),
  tool('date-calc', '日期计算器', 'Date Calculator', '计算日期间隔或加减天数', 'datetime', '＋', ['日期', '间隔', '工作日']),
  tool('timezone', '时区对照表', 'Time Zone Board', '同时查看常用城市的当前时间', 'datetime', '🌐', ['时区', 'Intl', '城市']),

  tool('color', '颜色转换与对比度', 'Color & Contrast', 'HEX、RGB、HSL 互转并检测 WCAG 对比度', 'media', '◉', ['颜色', 'WCAG', 'HEX']),
  tool('palette', '调色板生成', 'Palette Generator', '生成互补、三分与单色配色方案', 'media', '▦', ['配色', 'HSL', '调色板']),
  tool('image-compress', '图片压缩与转换', 'Image Compressor', '在浏览器内压缩图片并转换 WebP/JPEG/PNG', 'media', 'IMG', ['图片', 'WebP', '压缩']),
  tool('image-base64', '图片转 Data URL', 'Image to Data URL', '本地读取图片并生成 Data URL', 'media', 'B64', ['图片', 'Base64', 'Data URL']),
  tool('qrcode', '二维码生成', 'QR Code Generator', '可调颜色与容错级别，导出 PNG', 'media', '▩', ['二维码', 'PNG', 'QR']),
  tool('gradient', '渐变生成器', 'Gradient Generator', '可视化生成 CSS 线性渐变', 'media', '◒', ['CSS', '渐变', '颜色']),
  tool('svg-optimize', 'SVG 优化', 'SVG Optimizer', '压缩清理 SVG 源码', 'media', 'SVG', ['SVG', '优化'], 'planned', '需评估 SVGO 的浏览器端方案。'),
  tool('image-crop', '图片裁剪', 'Image Cropper', '自由或按比例裁剪图片', 'media', '⌗', ['图片', '裁剪'], 'planned', '拖拽与触控交互复杂，单独排期。'),
  tool('barcode', '条形码生成', 'Barcode Generator', '生成常见格式条形码', 'media', '|||', ['条形码'], 'planned', '使用频率与依赖体积待评估。'),

  tool('js-playground', 'JS 代码编辑器', 'JavaScript Playground', '在隔离 iframe 中安全运行 JavaScript', 'dev', 'JS', ['JavaScript', 'CodeMirror', '沙箱'], 'beta'),
  tool('hash', '哈希计算', 'Hash Calculator', '计算 SHA-1/256/384/512 摘要', 'dev', '#', ['SHA-256', 'Hash', 'Web Crypto']),
  tool('uuid', 'UUID 生成', 'UUID Generator', '用 Web Crypto 批量生成 UUID v4', 'dev', 'ID', ['UUID', '随机']),
  tool('regex-tester', '正则测试器', 'Regex Tester', '实时查看匹配结果与捕获组', 'dev', '.*', ['正则', 'RegExp', '匹配']),
  tool('unit', '单位换算', 'Unit Converter', '长度、重量、温度、存储与速度换算', 'dev', '⇄', ['单位', '换算']),
  tool('random', '安全随机生成', 'Secure Random', '生成密码、随机字符串或随机数', 'dev', '⚄', ['随机数', '密码', 'Web Crypto']),
  tool('cidr', 'IP / CIDR 计算器', 'CIDR Calculator', '计算 IPv4 网段、掩码与主机范围', 'dev', 'IP', ['IPv4', 'CIDR', '网络']),
  tool('md5', 'MD5 哈希', 'MD5 Hash', '计算兼容用途的 MD5 摘要', 'dev', 'MD5', ['MD5', 'Hash'], 'planned', 'Web Crypto 不支持 MD5，需审计自实现。'),
  tool('ua-parser', 'User-Agent 解析', 'UA Parser', '识别浏览器、系统与设备', 'dev', 'UA', ['User-Agent', '浏览器'], 'planned', '待评估 ua-parser-js 依赖。'),
  tool('password-strength', '密码强度检测', 'Password Strength', '估算密码抵抗猜测攻击的能力', 'dev', '***', ['密码', '安全'], 'planned', 'zxcvbn 词典体积约 800 KB。'),

  {
    ...tool('weather', '天气查询', 'Weather', '查询全球当前天气、24 小时趋势与 7 日预报', 'ai', '☀', ['天气', 'Open-Meteo', '预报'], 'beta'),
    dataSource: {
      provider: 'Open-Meteo', providerUrl: 'https://open-meteo.com/', docsUrl: 'https://open-meteo.com/en/docs',
      endpoints: ['GET https://geocoding-api.open-meteo.com/v1/search', 'GET https://api.open-meteo.com/v1/forecast'],
      auth: '无需 API Key，无需注册', license: '天气数据 CC BY 4.0；服务代码 AGPLv3',
      attribution: 'Weather data by Open-Meteo.com', rateLimit: '免费非商业用途按服务商公平使用政策',
      integration: 'Next.js Route Handler 服务端代理；地名缓存 24 小时，天气缓存 10 分钟',
    },
    execution: { mode: 'proxy', label: '服务端代理外部数据', note: '本站后端代为请求 Open-Meteo，不向其暴露浏览器 IP。' },
  },
  {
    ...tool('mcp-explorer', 'MCP 注册表查询', 'MCP Registry Explorer', '搜索官方 MCP Registry 并生成客户端配置', 'ai', 'MCP', ['MCP', 'Registry', '配置'], 'beta'),
    dataSource: {
      provider: 'Official MCP Registry', providerUrl: 'https://registry.modelcontextprotocol.io/', docsUrl: 'https://modelcontextprotocol.io/registry/about',
      endpoints: ['GET https://registry.modelcontextprotocol.io/v0.1/servers', 'GET /v0.1/servers/{name}/versions'],
      auth: '公共读取无需鉴权', license: 'Apache-2.0（注册表项目）', rateLimit: '官方未承诺固定配额与可用性',
      integration: 'Next.js Route Handler 服务端只读代理；响应缓存 5 分钟、上游超时 8 秒',
    },
    execution: { mode: 'proxy', label: '服务端代理外部数据', note: '本站后端只读访问官方 MCP Registry。' },
  },
  tool('token-count', 'Token 计数器', 'Token Counter', '按不同模型估算文本 Token 数量', 'ai', 'TOK', ['Token', 'LLM'], 'planned', 'tiktoken WASM 体积较大，需按需加载。'),
  tool('currency', '汇率换算', 'Currency Converter', '查询常用货币实时参考汇率', 'ai', '¥$', ['汇率', '货币'], 'planned', '需验证长期稳定的数据源与许可。'),
  tool('prompt-library', 'Prompt 模板库', 'Prompt Library', '整理可复用的提示词模板', 'ai', 'AI', ['Prompt', '模板'], 'planned', '内容维护成本较高，待明确定位。'),
];

export const getTool = (slug: string) => TOOLS.find((item) => item.slug === slug);
export const getAvailableTools = () => TOOLS.filter((item) => item.status !== 'planned');
export const groupByCategory = () => new Map(CATEGORIES.map((category) => [
  category.key,
  TOOLS.filter((item) => item.category === category.key),
]));
