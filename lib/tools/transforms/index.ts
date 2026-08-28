import type { TransformDef } from '../transform';

const sampleJson = `{"name":"工具箱","active":true,"items":[1,2,3]}`;
const utf8ToBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};
const base64ToUtf8 = (value: string) => {
  const binary = atob(value.trim());
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
};

function describeType(value: unknown, name: string, optional: boolean): string {
  const key = optional ? `${name}?` : name;
  if (value === null) return `  ${key}: null;`;
  if (Array.isArray(value)) {
    const first = value.find((item) => item !== null);
    const type = first === undefined ? 'unknown' : inlineType(first, `${name}Item`, optional);
    return `  ${key}: ${type}[];`;
  }
  if (typeof value === 'object') return `  ${key}: ${inlineType(value, name, optional)};`;
  return `  ${key}: ${typeof value};`;
}

function inlineType(value: unknown, name: string, optional: boolean): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return typeof value;
  const rows = Object.entries(value).map(([key, item]) => describeType(item, key, optional));
  return `{\n${rows.join('\n')}\n}`;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function csvToJson(text: string) {
  const [headers, ...rows] = parseCsv(text);
  if (!headers) return '[]';
  return JSON.stringify(rows.map((row) => Object.fromEntries(headers.map((key, index) => [key, row[index] ?? '']))), null, 2);
}

function jsonToCsv(text: string) {
  const data = JSON.parse(text) as Record<string, unknown>[];
  if (!Array.isArray(data)) throw new Error('JSON 顶层必须是对象数组');
  const headers = [...new Set(data.flatMap((item) => Object.keys(item)))];
  const escape = (value: unknown) => {
    const raw = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };
  return [headers.join(','), ...data.map((item) => headers.map((key) => escape(item[key])).join(','))].join('\n');
}

function words(value: string) {
  return value.trim().replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((item) => item.toLowerCase());
}

function parseInteger(value: string, radix: number) {
  const chars = value.trim().toLowerCase();
  if (!chars) throw new Error('请输入整数');
  let result = BigInt(0);
  for (const char of chars.replace(/^[-+]/, '')) {
    const digit = parseInt(char, 36);
    if (Number.isNaN(digit) || digit >= radix) throw new Error(`“${char}” 不是 ${radix} 进制数字`);
    result = result * BigInt(radix) + BigInt(digit);
  }
  return chars.startsWith('-') ? -result : result;
}

function ipv4ToInt(value: string) {
  const parts = value.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) throw new Error('IPv4 地址格式无效');
  return parts.reduce((result, part) => ((result << 8) | part) >>> 0, 0) >>> 0;
}
const intToIpv4 = (value: number) => [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');

const unitGroups: Record<string, Record<string, number>> = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254 },
  weight: { kg: 1, g: 0.001, lb: 0.45359237, oz: 0.028349523125 },
  storage: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
};

export const TRANSFORMS: Record<string, TransformDef> = {
  'yaml-json': {
    execution: 'server',
    options: [{ key: 'direction', label: '方向', type: 'select', defaultValue: 'yaml-json', choices: [{ value: 'yaml-json', label: 'YAML → JSON' }, { value: 'json-yaml', label: 'JSON → YAML' }] }],
    samples: [{ label: 'YAML 示例', value: 'name: 工具箱\nenabled: true\ntags:\n  - server\n  - yaml' }], outputLanguage: 'json',
  },
  'json-formatter': {
    run: (input, opts) => {
      if (opts.mode === 'escape') return JSON.stringify(input).slice(1, -1);
      if (opts.mode === 'unescape') return JSON.parse(`"${input.replace(/"/g, '\\"')}"`);
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed, null, opts.mode === 'minify' ? 0 : Number(opts.indent));
    },
    options: [
      { key: 'mode', label: '操作', type: 'select', defaultValue: 'format', choices: [{ value: 'format', label: '格式化' }, { value: 'minify', label: '压缩' }, { value: 'escape', label: '转义字符串' }, { value: 'unescape', label: '反转义' }] },
      { key: 'indent', label: '缩进', type: 'select', defaultValue: 2, choices: [{ value: '2', label: '2 空格' }, { value: '4', label: '4 空格' }] },
    ], samples: [{ label: '示例 JSON', value: sampleJson }], outputLanguage: 'json', inputPlaceholder: '粘贴 JSON…',
  },
  'json-to-ts': {
    run: (input, opts) => {
      const parsed = JSON.parse(input);
      const value = Array.isArray(parsed) ? parsed[0] ?? {} : parsed;
      return `export interface ${opts.name || 'Root'} ${inlineType(value, String(opts.name), Boolean(opts.optional))}`;
    },
    options: [{ key: 'name', label: '根类型名', type: 'text', defaultValue: 'Root' }, { key: 'optional', label: '全部属性可选', type: 'toggle', defaultValue: false }],
    samples: [{ label: '用户数据', value: '{"id":1,"name":"May","profile":{"active":true},"tags":["design"]}' }], outputLanguage: 'javascript',
  },
  base64: {
    run: utf8ToBase64, reverse: base64ToUtf8, inputLabel: '原文', outputLabel: 'Base64',
    samples: [{ label: '中文测试', value: '中文测试 · Hello, world!' }],
  },
  'url-tools': {
    run: (input, opts) => opts.mode === 'query'
      ? JSON.stringify(Object.fromEntries(new URL(input).searchParams), null, 2)
      : encodeURIComponent(input),
    reverse: (input) => decodeURIComponent(input),
    options: [{ key: 'mode', label: '模式', type: 'select', defaultValue: 'codec', choices: [{ value: 'codec', label: '组件编码' }, { value: 'query', label: '解析 URL 参数' }] }],
    samples: [{ label: '中文 URL', value: 'https://example.com/search?q=工具箱&sort=new' }],
  },
  radix: {
    run: (input, opts) => parseInteger(input, Number(opts.from)).toString(Number(opts.to)).toUpperCase(),
    options: [
      { key: 'from', label: '输入进制', type: 'number', defaultValue: 10 },
      { key: 'to', label: '输出进制', type: 'number', defaultValue: 16 },
    ], samples: [{ label: '255', value: '255' }],
  },
  'html-entity': {
    run: (input) => input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    reverse: (input) => input.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(?:39|x27);/g, "'").replace(/&amp;/g, '&'),
    samples: [{ label: 'HTML 片段', value: '<button title="开始">运行 & 保存</button>' }],
  },
  'jwt-decoder': {
    run: (input) => {
      const [header, payload] = input.trim().split('.');
      if (!header || !payload) throw new Error('JWT 应包含 header.payload.signature 三段');
      const decode = (part: string) => JSON.parse(base64ToUtf8(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')));
      return JSON.stringify({ header: decode(header), payload: decode(payload), verified: false }, null, 2);
    }, warning: '这里只解码内容，不验证签名。不要据此信任 Token。', outputLanguage: 'json',
  },
  'csv-json': {
    run: (input, opts) => opts.direction === 'csv-json' ? csvToJson(input) : jsonToCsv(input),
    reverse: (input, opts) => opts.direction === 'csv-json' ? jsonToCsv(input) : csvToJson(input),
    options: [{ key: 'direction', label: '方向', type: 'select', defaultValue: 'csv-json', choices: [{ value: 'csv-json', label: 'CSV → JSON' }, { value: 'json-csv', label: 'JSON → CSV' }] }],
    samples: [{ label: '人员 CSV', value: 'name,city\nMay,杭州\nAlex,"New York"' }], outputLanguage: 'json',
  },
  unicode: {
    run: (input) => [...input].map((char) => `U+${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}  ${char === ' ' ? 'SPACE' : char}`).join('\n'),
    reverse: (input) => input.replace(/\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4})/gi, (_, long, short) => String.fromCodePoint(parseInt(long || short, 16))),
    samples: [{ label: '字符样本', value: '汉字 👋 A\u200B' }],
  },
  'case-converter': {
    run: (input, opts) => {
      const parts = words(input);
      const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
      switch (opts.style) {
        case 'camel': return parts.map((item, index) => index ? cap(item) : item).join('');
        case 'pascal': return parts.map(cap).join('');
        case 'snake': return parts.join('_');
        case 'constant': return parts.join('_').toUpperCase();
        case 'title': return parts.map(cap).join(' ');
        default: return parts.join('-');
      }
    }, options: [{ key: 'style', label: '目标风格', type: 'select', defaultValue: 'camel', choices: [
      { value: 'camel', label: 'camelCase' }, { value: 'pascal', label: 'PascalCase' }, { value: 'snake', label: 'snake_case' },
      { value: 'kebab', label: 'kebab-case' }, { value: 'constant', label: 'CONSTANT_CASE' }, { value: 'title', label: 'Title Case' },
    ] }], samples: [{ label: '命名样本', value: 'my useful-tool Name' }],
  },
  'code-format': {
    execution: 'server', options: [{ key: 'parser', label: '语言', type: 'select', defaultValue: 'babel', choices: [{ value: 'babel', label: 'JavaScript' }, { value: 'typescript', label: 'TypeScript' }, { value: 'css', label: 'CSS' }, { value: 'json', label: 'JSON' }, { value: 'html', label: 'HTML' }] }, { key: 'semi', label: '保留分号', type: 'toggle', defaultValue: true }],
    samples: [{ label: 'JS 示例', value: 'const hello={name:"tools",items:[1,2,3]};console.log(hello)' }], outputLanguage: 'javascript',
  },
  'sql-format': {
    execution: 'server', options: [{ key: 'language', label: '方言', type: 'select', defaultValue: 'sql', choices: [{ value: 'sql', label: 'Standard SQL' }, { value: 'postgresql', label: 'PostgreSQL' }, { value: 'mysql', label: 'MySQL' }, { value: 'sqlite', label: 'SQLite' }] }, { key: 'keywordCase', label: '关键字', type: 'select', defaultValue: 'upper', choices: [{ value: 'upper', label: 'UPPERCASE' }, { value: 'lower', label: 'lowercase' }, { value: 'preserve', label: '保持原样' }] }],
    samples: [{ label: '查询示例', value: 'select u.id,u.name,count(p.id) as posts from users u left join posts p on p.user_id=u.id where u.active=true group by u.id,u.name order by posts desc;' }],
  },
  'text-ops': {
    run: (input, opts) => {
      let lines = input.split(/\r?\n/);
      if (opts.operation === 'unique') lines = [...new Set(lines)];
      if (opts.operation === 'sort') lines.sort((a, b) => a.localeCompare(b, 'zh-CN'));
      if (opts.operation === 'remove-empty') lines = lines.filter((line) => line.trim());
      if (opts.operation === 'reverse') lines.reverse();
      if (opts.operation === 'number') lines = lines.map((line, index) => `${index + 1}. ${line}`);
      return lines.join('\n');
    }, options: [{ key: 'operation', label: '操作', type: 'select', defaultValue: 'unique', choices: [
      { value: 'unique', label: '去除重复行' }, { value: 'sort', label: '排序' }, { value: 'remove-empty', label: '删除空行' },
      { value: 'reverse', label: '反转行序' }, { value: 'number', label: '添加行号' },
    ] }], samples: [{ label: '重复行', value: 'apple\nbanana\napple\n\norange' }],
  },
  'word-count': {
    run: (input) => {
      const chinese = input.match(/[\p{Script=Han}]/gu)?.length ?? 0;
      const english = input.match(/[A-Za-z]+(?:'[A-Za-z]+)*/g)?.length ?? 0;
      const chars = [...input].length;
      const minutes = Math.max(1, Math.ceil((chinese + english) / 300));
      return JSON.stringify({ 字符数: chars, 汉字数: chinese, 英文单词: english, 行数: input ? input.split(/\r?\n/).length : 0, 预计阅读: `${minutes} 分钟` }, null, 2);
    }, outputLanguage: 'json',
  },
  lorem: {
    run: (_input, opts) => {
      const zh = '设计并不是把事物装饰得更漂亮，而是让复杂的关系变得清晰。好的工具安静地工作，在需要时给出恰到好处的反馈。';
      const en = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.';
      return Array.from({ length: Number(opts.paragraphs) }, (_, index) => opts.language === 'zh' ? `${zh}${index % 2 ? '每一次选择都应该帮助读者更快抵达真正重要的内容。' : ''}` : en).join('\n\n');
    }, generator: true, options: [{ key: 'language', label: '语言', type: 'select', defaultValue: 'zh', choices: [{ value: 'zh', label: '中文' }, { value: 'en', label: 'Lorem Ipsum' }] }, { key: 'paragraphs', label: '段落数', type: 'number', defaultValue: 3 }], outputLabel: '生成结果',
  },
  'date-calc': {
    run: (input, opts) => {
      const start = input ? new Date(input) : new Date();
      if (Number.isNaN(start.getTime())) throw new Error('请输入有效日期，例如 2026-08-28');
      const result = new Date(start);
      result.setDate(result.getDate() + Number(opts.days));
      return JSON.stringify({ 起始日期: start.toLocaleDateString('zh-CN'), 增减天数: Number(opts.days), 结果日期: result.toLocaleDateString('zh-CN'), ISO: result.toISOString() }, null, 2);
    }, options: [{ key: 'days', label: '增减天数', type: 'number', defaultValue: 30 }], samples: [{ label: '今天', value: new Date().toISOString().slice(0, 10) }], outputLanguage: 'json',
  },
  hash: {
    run: async (input, opts) => {
      const buffer = await crypto.subtle.digest(String(opts.algorithm), new TextEncoder().encode(input));
      return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }, options: [{ key: 'algorithm', label: '算法', type: 'select', defaultValue: 'SHA-256', choices: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map((value) => ({ value, label: value })) }],
  },
  uuid: {
    run: (_input, opts) => Array.from({ length: Math.min(100, Math.max(1, Number(opts.count))) }, () => crypto.randomUUID()).join('\n'),
    generator: true, options: [{ key: 'count', label: '数量', type: 'number', defaultValue: 5 }], outputLabel: 'UUID v4',
  },
  unit: {
    run: (input, opts) => {
      const value = Number(input);
      if (!Number.isFinite(value)) throw new Error('请输入数字');
      if (opts.category === 'temperature') {
        const c = opts.from === 'C' ? value : opts.from === 'F' ? (value - 32) * 5 / 9 : value - 273.15;
        const result = opts.to === 'C' ? c : opts.to === 'F' ? c * 9 / 5 + 32 : c + 273.15;
        return `${result.toLocaleString('zh-CN', { maximumFractionDigits: 8 })} ${opts.to}`;
      }
      const group = unitGroups[String(opts.category)];
      if (!group?.[String(opts.from)] || !group?.[String(opts.to)]) throw new Error('当前分类不包含所选单位');
      return `${(value * group[String(opts.from)] / group[String(opts.to)]).toLocaleString('zh-CN', { maximumFractionDigits: 10 })} ${opts.to}`;
    }, options: [
      { key: 'category', label: '分类', type: 'select', defaultValue: 'length', choices: [{ value: 'length', label: '长度' }, { value: 'weight', label: '重量' }, { value: 'storage', label: '存储（1024）' }, { value: 'temperature', label: '温度' }] },
      { key: 'from', label: '从', type: 'text', defaultValue: 'm' }, { key: 'to', label: '到', type: 'text', defaultValue: 'km' },
    ], samples: [{ label: '1000', value: '1000' }],
  },
  random: {
    run: (_input, opts) => {
      const length = Math.min(1024, Math.max(1, Number(opts.length)));
      if (opts.kind === 'number') {
        const bytes = new Uint32Array(length); crypto.getRandomValues(bytes); return [...bytes].map((value) => value.toString()).join('\n');
      }
      const chars = opts.kind === 'hex' ? '0123456789abcdef' : 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%_-';
      const bytes = new Uint32Array(length); crypto.getRandomValues(bytes);
      return [...bytes].map((value) => chars[value % chars.length]).join('');
    }, generator: true, options: [{ key: 'kind', label: '类型', type: 'select', defaultValue: 'password', choices: [{ value: 'password', label: '密码字符' }, { value: 'hex', label: '十六进制' }, { value: 'number', label: '随机整数' }] }, { key: 'length', label: '长度 / 数量', type: 'number', defaultValue: 24 }], outputLabel: '安全随机结果',
  },
  cidr: {
    run: (input) => {
      const [ipText, prefixText = '24'] = input.trim().split('/');
      const prefix = Number(prefixText);
      if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error('前缀长度必须在 0–32');
      const ip = ipv4ToInt(ipText);
      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      const network = (ip & mask) >>> 0;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const hosts = prefix >= 31 ? 0 : Math.max(0, 2 ** (32 - prefix) - 2);
      return JSON.stringify({ CIDR: `${intToIpv4(network)}/${prefix}`, 子网掩码: intToIpv4(mask), 网络地址: intToIpv4(network), 广播地址: intToIpv4(broadcast), 首个主机: hosts ? intToIpv4((network + 1) >>> 0) : '—', 最后主机: hosts ? intToIpv4((broadcast - 1) >>> 0) : '—', 可用主机数: hosts }, null, 2);
    }, samples: [{ label: '局域网', value: '192.168.1.42/24' }], outputLanguage: 'json',
  },
};

export const hasTransform = (slug: string) => Boolean(TRANSFORMS[slug]);
