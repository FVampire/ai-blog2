# 工具列表页（/tools）设计与实施计划

> 状态：已实施（2026-08-28；执行模型已扩展为 local / server / proxy / hybrid）
> 创建日期：2026-08-28
> 目标分支：`feature/tools-page`

---

## 1. 目标

在博客站点中新增一个 **工具集合区**，收录尽可能多的「常见、实现成本低、但真实可用」的在线小工具。

核心诉求：

1. 一个 `/tools` 列表页（**按分类展示**）+ 每个工具独立子页面（`/tools/<slug>`）。
2. 四个重点工具：**天气查询**、**Markdown 转 HTML**、**MCP 查询**、**JS 代码编辑器**。
3. 凡是接入第三方服务的工具，**必须在页面上显式标注数据来源与接入方式**（服务商、文档链接、实际请求的 endpoint、是否需要 Key、许可协议、调用配额）。
4. **工具数量优先**：能低成本实现的直接实现；实现成本高的（需要重型依赖 / 服务端能力）先在列表页以「规划中」状态占位展示，后续再补。

非目标（本期不做）：

- 工具的后台管理界面（工具通过代码内静态注册表维护，不入库）。
- 用户账号体系 / 工具使用记录持久化。

### 已确认的范围决策

| 议题 | 决定 |
| --- | --- |
| MCP 查询范围 | **只做公共注册表检索**，不接触本站已配置的本地 MCP 服务器 |
| 小工具数量 | **越多越好**，按分类展示；易实现的直接做，难的先占位 |
| 天气数据源 | **只用 Open-Meteo**，不接和风天气 |
| 导航文案 | `Tools`（与现有全英文导航保持一致） |

---

## 2. 现状盘点（信息收集结论）

### 2.1 技术栈

| 项 | 值 |
| --- | --- |
| 框架 | Next.js `15.3.9`，App Router，非静态导出（Node server） |
| React | `19.1.2` |
| TypeScript | `5.4.5`（`next.config.js` 中 `typescript.ignoreBuildErrors: true`） |
| 包管理器 | pnpm `10.33.0`（`pnpm-lock.yaml`） |
| 样式 | 全局 CSS（`styles/globals.css`）+ CSS Modules + Tailwind 4（混用） |
| 路径别名 | `@/*` → 项目根 |
| 数据层 | PostgreSQL + TypeORM Repository 模式 |

### 2.2 可直接复用的现有资产

| 资产 | 位置 | 用途 |
| --- | --- | --- |
| 页面外壳约定 | `app/projects/page.tsx` | `<div><Header /><main className={styles.page}>…</main><Footer /></div>` |
| 导航 | `components/Header.tsx:55-67` | 在 `<nav className="navigation">` 内加一个 `<NavLink>` |
| 卡片网格 | `styles/globals.css:762-941` | `.projects-grid`（`repeat(auto-fill, minmax(320px, 1fr))`）、`.project-card*` |
| 设计 token | `styles/globals.css:7-110` | `--primary-cyan/-blue/-purple/-pink`、`--warm-*`、`--space-*`、`--font-display/-body/-mono`、`--radius-*` |
| Markdown 渲染 | `app/posts/[slug]/page.tsx:124-131` | `react-markdown` + `remark-gfm` + `rehype-raw/-highlight/-slug` |
| Markdown 样式 | `styles/globals.css:2254-2516` | `.markdown-preview` 排版 + 手写的 `.hljs` 配色（Material Ocean 风格） |
| 剪贴板工具 | `components/AIChatWidget/utils/helpers.ts:1-10` | `copyToClipboard()`，提升为共享 util |
| Markdown 工具栏插入逻辑 | `components/MarkdownEditor.tsx` | 粗体/链接/代码块快捷插入，可直接搬用 |

### 2.3 现有缺口（需要本期补上或规避）

1. **无文件下载工具函数**：全仓库搜不到 `createObjectURL`，需新建 `lib/tools/download.ts`。
2. **无代码编辑器**：仓库里没有 Monaco / CodeMirror / Ace，所有编辑器都是裸 `<textarea>`。
3. **无 Markdown → HTML 字符串管线**：现有的是 `react-markdown`（直接产出 React 元素），导出 HTML 需要一条 `unified` 管线。
4. **`.hljs` 样式是手写的**，没有引入 highlight.js 官方主题包；Markdown 导出的「自包含 HTML」需要把这段 CSS 内联进去。
5. 站点**没有全站暗色模式**，暗色只是设计 token 里的局部配色。Markdown 的「炫酷模式」必须自带完整配色，不能依赖全局主题。

### 2.4 顺带发现的安全问题（已处理）

`app/api/mcp/tools` 与 `app/api/mcp/execute` 原先完全没有鉴权，却会 `spawn()` 执行数据库里配置的命令。工具页从未使用这两条路由，已删除，避免误修字段名后把 RCE 面变成实弹。

---

## 3. 架构设计

### 3.1 核心思路：统一交互形态，按能力选择执行位置

要支撑「工具数量越多越好」，关键不在于多写页面，而在于**别把每个工具都当独立页面从零写**。

观察 §8 的候选清单可以发现，绝大多数工具都是同一个形状：

```
输入文本 ──(选项)──▶ 纯函数 ──▶ 输出文本 / 错误
```

因此设计一个 `TransformTool` 抽象。这里的“纯函数”描述的是输入/输出契约，**不限定代码必须在浏览器执行**。每个工具同时声明执行模式：

- `local`：浏览器本地处理，适合隐私敏感、轻量且 Web API 足够的任务；
- `server`：站内 Route Handler 执行，适合重型依赖、Node 原生能力、文件处理或需要统一资源限制的任务；
- `proxy`：站内后端代理第三方数据源，负责隐藏访客 IP、缓存、超时、限流与响应归一化；
- `hybrid`：前后端协作，例如浏览器负责预览、服务端负责高质量导出。

当前 YAML、SQL、Prettier 格式化器采用 `server`，天气和 MCP 采用 `proxy`，其余轻量文本工具优先 `local`。页面必须显示处理位置；凡输入会离开浏览器，也必须明确告知是否持久化。

统一接口如下：

```ts
// lib/tools/transform.ts
export interface TransformOption {
  key: string;
  label: string;
  type: 'select' | 'toggle' | 'text' | 'number';
  choices?: { value: string; label: string }[];
  defaultValue: string | boolean | number;
}

export interface TransformDef {
  /** 纯函数：抛错即为校验失败，错误信息直接展示给用户 */
  run?: (input: string, opts: Record<string, any>) => string;
  execution?: 'client' | 'server';
  options?: TransformOption[];
  inputLabel?: string;
  outputLabel?: string;
  inputPlaceholder?: string;
  samples?: { label: string; value: string }[];
  /** 是否支持左右互换（如 Base64 编码 ↔ 解码） */
  reverse?: (input: string, opts: Record<string, any>) => string;
  outputLanguage?: 'json' | 'javascript' | 'html' | 'plain';
}
```

配套一个 `<TransformToolView def={...} meta={...} />` 客户端组件，统一提供：

- 双栏输入/输出布局（小屏自动堆叠）
- 实时转换（防抖 200ms）+ 错误提示条
- 复制 / 清空 / 交换 / 下载 / 示例填充 / 拖入文件
- 输入草稿自动存 `localStorage`
- 字符数统计

**这样新增一个工具的成本降到「实现一个本地函数或服务端 handler + 注册表加一条」，通常 20–40 行。** 只有天气、Markdown、MCP、JS 演练场、图片类、颜色类这些交互形态特殊的才需要写定制页面。

### 3.2 路由结构

```
/tools                        工具列表页（Server Component，按分类分组）
/tools/weather                天气查询          ← 定制页
/tools/markdown-to-html       Markdown 转 HTML  ← 定制页
/tools/mcp-explorer           MCP 查询          ← 定制页
/tools/js-playground          JS 代码编辑器      ← 定制页
/tools/json-formatter         JSON 格式化       ← TransformTool
/tools/base64                 Base64 编解码     ← TransformTool
/tools/<slug>                 …其余见 §8
```

实施时采用 **`[slug]` 通用路由 + 重点工具静态路由**：通用 TransformTool 由注册表生成静态参数，天气、Markdown、MCP、JS 等定制页面用同名静态目录覆盖。这样客户端与服务端 Transform 共用一套页面，也避免几十个内容完全相同的 `page.tsx`。

```tsx
// app/tools/base64/page.tsx
import TransformToolView from '@/components/tools/TransformToolView';
import { getTool } from '@/lib/tools/registry';
import { base64Def } from '@/lib/tools/transforms/base64';

const meta = getTool('base64')!;
export const metadata = { title: `${meta.name} - 工具箱`, description: meta.description };

export default function Page() {
  return <TransformToolView def={base64Def} meta={meta} />;
}
```

### 3.3 工具注册表

工具元数据用**代码内静态注册表**，不入库。理由：工具就是代码，元数据和实现强绑定；入库会带来迁移成本和「数据库有记录但代码没实现」的不一致。

`lib/tools/registry.ts`：

```ts
export type ToolCategory = 'encode' | 'text' | 'datetime' | 'media' | 'dev' | 'ai';
export type ToolStatus = 'stable' | 'beta' | 'planned';   // planned = 列表占位，未实现

/** 第三方数据源标注（硬性要求：必须标注用了谁、怎么接的） */
export interface DataSourceMeta {
  provider: string;          // 例：Open-Meteo
  providerUrl: string;
  docsUrl: string;
  endpoints: string[];       // 实际调用的 endpoint
  auth: string;              // 例：无需 API Key
  license: string;           // 例：CC BY 4.0
  attribution?: string;      // 协议要求的署名文案
  rateLimit?: string;        // 例：非商业用途 10,000 次/日
  integration: string;       // 接入方式（直连 / 服务端代理 / 缓存策略）
}

export interface ToolMeta {
  slug: string;
  name: string;              // 中文名
  enName: string;            // 英文副标题
  tagline: string;           // 卡片一句话
  description: string;       // 详情页说明
  category: ToolCategory;
  tags: string[];
  status: ToolStatus;
  icon: string;
  accent: string;            // 卡片主色，取自设计 token
  dataSource?: DataSourceMeta;
  plannedNote?: string;      // status='planned' 时说明「为什么还没做」
}

export const CATEGORIES: { key: ToolCategory; name: string; desc: string }[] = [
  { key: 'encode',   name: '编码转换', desc: '格式互转、编解码、序列化' },
  { key: 'text',     name: '文本处理', desc: '文本清洗、对比、生成' },
  { key: 'datetime', name: '时间日期', desc: '时间戳、时区、定时表达式' },
  { key: 'media',    name: '颜色与图像', desc: '取色、压缩、格式转换' },
  { key: 'dev',      name: '开发辅助', desc: '哈希、正则、代码运行' },
  { key: 'ai',       name: 'AI 与数据', desc: '模型生态、外部数据源' },
];

export const TOOLS: ToolMeta[] = [ /* … 见 §8 */ ];

export const getTool = (slug: string) => TOOLS.find(t => t.slug === slug);
export const getAvailableTools = () => TOOLS.filter(t => t.status !== 'planned');
export const groupByCategory = () => /* Map<ToolCategory, ToolMeta[]> */;
```

### 3.4 目录结构

```
app/tools/
├── layout.tsx                     # 共享 Header/Footer 外壳
├── page.tsx                       # 列表页（Server Component）
├── tools.module.css
├── weather/{page.tsx, WeatherTool.tsx, weather.module.css}
├── markdown-to-html/{page.tsx, MarkdownTool.tsx, markdown-tool.module.css}
├── mcp-explorer/{page.tsx, McpExplorer.tsx, mcp-explorer.module.css}
├── js-playground/{page.tsx, JsPlayground.tsx, SandboxRunner.tsx, *.module.css}
├── color/{page.tsx, ColorTool.tsx}          # 定制交互
├── image-compress/{page.tsx, ImageTool.tsx} # 定制交互
├── regex-tester/{page.tsx, RegexTool.tsx}   # 定制交互
├── text-diff/{page.tsx, DiffTool.tsx}       # 定制交互
└── [slug]/page.tsx                # local/server TransformTool 通用路由

components/tools/
├── ToolCard.tsx                   # 列表页卡片（含 planned 态）
├── ToolShell.tsx                  # 详情页统一外壳（面包屑/标题/说明/相关工具/数据源栏）
├── TransformToolView.tsx          # ★ 通用「输入→输出」工具视图
├── DataSourceNote.tsx             # ★ 第三方来源标注面板
├── CopyButton.tsx
├── CategoryFilter.tsx             # 'use client' 分类筛选
└── tools-shared.module.css

lib/tools/
├── registry.ts
├── transform.ts                   # TransformDef 类型
├── download.ts                    # downloadTextFile / downloadBlob
├── clipboard.ts                   # copyText / copyRichHtml
├── transforms/                    # ★ 每个文件一个纯函数工具
│   ├── json.ts  base64.ts  url.ts  radix.ts  html-entity.ts
│   ├── jwt.ts   hash.ts    uuid.ts timestamp.ts  case.ts
│   ├── text-ops.ts  lorem.ts  unit.ts  csv.ts  cron.ts
│   └── index.ts
├── weather/{wmo.ts, types.ts}
└── markdown/{render.ts, themes.ts, inline-styles.ts}

app/api/tools/
├── weather/route.ts               # Open-Meteo 预报代理
├── weather/geocode/route.ts       # Open-Meteo 地理编码代理
└── mcp/registry/route.ts          # 官方 MCP Registry 代理
```

### 3.5 列表页设计（按分类展示）

沿用 `app/projects/page.tsx` 的编辑式排版：

- **顶部 intro**：eyebrow（`TOOLBOX · NN TOOLS · N CATEGORIES`）+ 大标题 + 说明段落。
- **分类筛选条**：`全部 / 编码转换 / 文本处理 / 时间日期 / 颜色与图像 / 开发辅助 / AI 与数据`，纯客户端 state（`components/tools/CategoryFilter.tsx`），列表页本体保持 Server Component。
- **搜索框**：对工具名 / tagline / tags 做本地模糊匹配。工具多了以后这个比分类更常用。
- **按分类分组渲染**：每组一个 section，组标题 + 描述 + `.projects-grid` 网格。
- **卡片内容**：图标 / 中文名 + 英文副标题 / tagline / tag 徽章 / `accent` 主色描边 + hover 位移；若有第三方依赖则显示 `Powered by <provider>` 小字。
- **`planned` 态卡片**：降低透明度、不可点击、右上角「规划中」角标，hover 显示 `plannedNote`（说明还差什么）。这样清单的完整性对访客可见，也方便自己排后续优先级。

### 3.6 导航接入

`components/Header.tsx` 的 `<nav>` 内，在 `Tags` 前插入：

```tsx
<NavLink href="/tools">Tools</NavLink>
```

`NavLink` 已通过 `usePathname()` 的 `startsWith` 处理激活态，`/tools/base64` 会正确高亮 `Tools`，无需改动。

---

## 4. 重点工具详细设计

### 4.1 天气查询 `/tools/weather`

#### 选型：Open-Meteo（已确认唯一数据源）

已实测验证（2026-08-28 实际请求通过）：

| 项 | 值 |
| --- | --- |
| 服务商 | [Open-Meteo](https://open-meteo.com/) |
| 文档 | https://open-meteo.com/en/docs |
| 是否需要 Key | **不需要**，无需注册 |
| CORS | 支持 |
| 许可 | 数据 CC BY 4.0（**署名为强制要求**），代码 AGPLv3 |
| 配额 | 非商业用途 10,000 次/日 |
| 覆盖 | 全球，30+ 气象模型，`best_match` 自动选最高分辨率模型 |

选它的原因：零 Key、零注册、CORS 友好、CC BY 4.0 只要署名即可、地理编码 API 支持中文（`language=zh`）。

> 备选方案备忘（当前不实施）：和风天气 QWeather 在中国境内精度更好、能拿到空气质量和生活指数，但需要注册申请 API Key。若日后国内精度成为痛点可再评估。

#### 接入方式：服务端代理 + 缓存

虽然 Open-Meteo 支持 CORS 可以直连，但仍走 Next.js Route Handler 代理：

1. 访客 IP 不直接暴露给第三方。
2. 用 `next: { revalidate }` 做缓存，显著降低配额消耗（10k/日 在有流量时会很紧）。
3. WMO 天气代码 → 中文描述的映射在服务端完成，客户端拿到即可直接渲染。
4. 便于把「本次实际请求的 URL」回传给前端，用于 §5 的来源标注展示。

**`GET /api/tools/weather/geocode?q=杭州`**

代理 → `https://geocoding-api.open-meteo.com/v1/search?name=<q>&count=8&language=zh&format=json`

实测返回（用 `q=hangzhou` 拼音也能命中）：

```json
{"results":[{"id":1808926,"name":"杭州","latitude":30.29365,"longitude":120.16142,
  "country_code":"CN","timezone":"Asia/Shanghai","population":9236032,
  "country":"中国","admin1":"浙江","admin2":"杭州市"}, …]}
```

缓存：`revalidate: 86400`（地名坐标几乎不变）。

**`GET /api/tools/weather?lat=&lon=&name=`**

代理 → `https://api.open-meteo.com/v1/forecast`，参数：

```
current  = temperature_2m, relative_humidity_2m, apparent_temperature, is_day,
           precipitation, weather_code, wind_speed_10m, wind_direction_10m
hourly   = temperature_2m, weather_code, precipitation_probability
daily    = weather_code, temperature_2m_max, temperature_2m_min,
           precipitation_probability_max, sunrise, sunset
timezone = auto
forecast_days = 7
```

缓存：`revalidate: 600`（上游 `current.interval` 为 900 秒，10 分钟足够新鲜）。

响应包装成站内统一格式并附来源元信息：

```json
{ "success": true,
  "data": { "location": {...}, "current": {...}, "hourly": [...], "daily": [...] },
  "meta": { "provider": "Open-Meteo",
            "requestUrl": "https://api.open-meteo.com/v1/forecast?…",
            "fetchedAt": "2026-08-28T13:45:00+08:00", "cacheSeconds": 600 } }
```

#### WMO 天气代码映射

`lib/tools/weather/wmo.ts`，Open-Meteo 的 `weather_code` 遵循 WMO 4677 标准：

| 代码 | 中文 | 代码 | 中文 |
| --- | --- | --- | --- |
| 0 | 晴 | 61 / 63 / 65 | 小雨 / 中雨 / 大雨 |
| 1 / 2 / 3 | 大部晴朗 / 局部多云 / 阴 | 66 / 67 | 小冻雨 / 大冻雨 |
| 45 / 48 | 雾 / 雾凇 | 71 / 73 / 75 | 小雪 / 中雪 / 大雪 |
| 51 / 53 / 55 | 小毛毛雨 / 毛毛雨 / 大毛毛雨 | 77 | 米雪 |
| 56 / 57 | 小冻毛毛雨 / 大冻毛毛雨 | 80 / 81 / 82 | 小阵雨 / 阵雨 / 强阵雨 |
| | | 85 / 86 | 小阵雪 / 大阵雪 |
| | | 95 / 96 / 99 | 雷暴 / 雷暴伴小冰雹 / 雷暴伴大冰雹 |

每个代码同时映射昼/夜两套图标（用 `current.is_day` 区分）。

#### UI

- 搜索框：中英文/拼音均可 → 300ms 防抖调 geocode → 下拉候选（`name · admin1 · country`，同名地区用 `admin2` + 人口区分）。
- 「使用我的位置」：`navigator.geolocation`，失败静默降级为手动搜索。
- 当前天气大卡：温度 / 体感 / 图标+描述 / 湿度 / 风速风向 / 降水量。
- 24 小时趋势：纯 SVG 折线，不引图表库。
- 7 日预报：图标 + 最高/最低温条 + 降水概率。
- °C ↔ °F 切换，记忆到 `localStorage`；最近查询城市存最近 5 条。
- 底部 `<DataSourceNote>`（见 §5）+ CC BY 4.0 强制署名：`Weather data by Open-Meteo.com`（带链接）。

---

### 4.2 Markdown 转 HTML `/tools/markdown-to-html`

#### 渲染管线

现有的 `react-markdown` 只产出 React 元素，无法导出。新建 `lib/tools/markdown/render.ts`，用 `unified` 管线产出 **HTML 字符串**，预览与导出共用同一份输出，保证所见即所得：

```
remark-parse
  → remark-gfm            表格 / 任务列表 / 删除线
  → remark-rehype         allowDangerousHtml 跟随「允许原始 HTML」开关
  → rehype-raw            仅在允许原始 HTML 时启用
  → rehype-sanitize       默认启用，可关闭
  → rehype-slug           标题锚点（用于生成目录）
  → rehype-highlight      代码高亮（highlight.js class）
  → rehype-stringify
```

预览区用 `dangerouslySetInnerHTML` 渲染该字符串，安全说明见 §7.1。

#### 两种模式

两套主题都写成**纯 CSS 字符串**放在 `lib/tools/markdown/themes.ts`，既能注入预览容器，又能在导出时内联进 `<style>`。

**普通模式（`plain`）**——干净的文档风格：

- 浅色背景，GitHub 风格排版；系统字体栈 + 等宽代码
- 表格斑马纹、引用块左侧竖线
- `.hljs` 沿用 `styles/globals.css:2479-2516` 的 Material Ocean 配色
- 适合贴到文档站、内部 wiki、邮件

**炫酷模式（`neon`）**——呼应站点设计 token 的深色霓虹风：

- 深色底 `#0F1419`（即 `--bg-dark-section`）
- 标题用青→紫渐变文字 + 轻微辉光
- 代码块玻璃拟态：半透明 + `backdrop-filter: blur()` + 青色描边
- 链接 hover 扫光动画、引用块渐变左边框、表格行 hover 高亮
- 标题入场 `fade-in-up` 动画（导出时可选保留）
- ⚠️ **主题 CSS 里的颜色必须写死字面量**，不能引用 `var(--primary-cyan)`——导出的 HTML 是独立文件，拿不到站点 `:root` 里的 token。

#### 导出能力

| 方式 | 实现 | 说明 |
| --- | --- | --- |
| 复制 HTML 片段 | `navigator.clipboard.writeText` | 仅 `<body>` 内容，不含样式 |
| 复制完整 HTML | 同上 | 含 `<style>` 的自包含文档 |
| 下载 `.html` | `Blob` + `URL.createObjectURL` + `<a download>` | 自包含单文件，双击即可打开 |
| 复制富文本 | `ClipboardItem({ 'text/html', 'text/plain' })` | 直接粘进飞书 / Word / Notion 保留格式 |
| **复制内联样式版** | 见下 | 微信公众号 / 邮件客户端专用 |
| 导出 PDF | `window.print()` + `@media print` | 走浏览器打印，不引 PDF 库 |

**内联样式版**是这个工具的差异化价值：微信公众号编辑器和多数邮件客户端会剥离 `<style>` 标签，只认元素上的 `style` 属性。实现上不引入 `juice` 这类依赖，而是利用已渲染好的 DOM（`lib/tools/markdown/inline-styles.ts`）：

1. 把 HTML 渲染进隐藏容器并应用主题 CSS；
2. 遍历所有节点，用 `getComputedStyle` 读取**白名单属性**（`color`、`background`、`font-*`、`margin`、`padding`、`border*`、`line-height`、`text-align` 等）；
3. 写入元素 `style` 属性，取 `outerHTML`。

约 60 行代码，零新增依赖，结果与预览完全一致。

#### 其他功能

- 左右分栏可拖拽调节比例；小屏改为上下 Tab 切换。
- 输入区先用 `<textarea>`（复用 `MarkdownEditor.tsx` 的样式与插入逻辑）；若 §4.4 已引入 CodeMirror，二期可平滑替换为带 Markdown 语法高亮的编辑器。
- 工具栏：粗体 / 斜体 / 链接 / 代码块 / 表格 / 图片 快捷插入。
- 自动生成目录（基于 `rehype-slug` 的锚点），可开关。
- 草稿自动存 `localStorage`；支持拖拽 `.md` 文件载入。
- 字数 / 字符数 / 预计阅读时长统计。

---

### 4.3 MCP 查询 `/tools/mcp-explorer`

**范围已确认：只做官方公共注册表检索，不接触本站已配置的本地 MCP 服务器。** 因此本工具是纯粹的外部只读数据消费，不涉及任何 `spawn()` 或本地进程能力。

#### 数据源：官方 MCP Registry

已实测可用（2026-08-28）：

| 项 | 值 |
| --- | --- |
| 服务商 | Model Context Protocol 官方注册表 |
| Base URL | `https://registry.modelcontextprotocol.io` |
| 文档 | https://modelcontextprotocol.io/registry/registry-aggregators |
| 鉴权 | 读接口无需鉴权 |
| 端点 | `GET /v0.1/servers`、`GET /v0.1/servers/{name}/versions`、`GET /v0.1/servers/{name}/versions/{version}` |
| 查询参数 | `search`（服务器名子串，大小写不敏感）、`limit`（默认 30，上限 100）、`cursor`、`version=latest`、`updated_since` |
| 分页 | 游标式，响应 `metadata.nextCursor` 回传给 `cursor` |

实测响应结构：

```json
{
  "servers": [{
    "server": {
      "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
      "name": "ac.tandem/docs-mcp",
      "title": "Tandem Docs",
      "description": "Remote MCP server for Tandem docs, install guides, SDKs…",
      "version": "0.3.2",
      "repository": { "url": "https://github.com/frumu-ai/tandem", "source": "github" },
      "websiteUrl": "https://tandem.ac/docs-mcp",
      "remotes": [{ "type": "streamable-http", "url": "https://tandem.ac/mcp" }]
    },
    "_meta": { "io.modelcontextprotocol.registry/official": {
      "status": "active", "publishedAt": "…", "updatedAt": "…", "isLatest": true } }
  }],
  "metadata": { "nextCursor": "ac.tandem/docs-mcp:0.3.2", "count": 2 }
}
```

两个实现注意点：

- 路径参数中的 `serverName` **必须 URL 编码**：`io.modelcontextprotocol/everything` → `io.modelcontextprotocol%2Feverything`。
- 官方文档明确说明该注册表 **不提供可用性和数据持久性保证**，代理层必须做超时（8s）与失败降级（展示友好的错误态而非白屏）。

#### 接入方式

走 `/api/tools/mcp/registry` 服务端代理，`revalidate: 300`。代理的必要性：官方注册表未承诺 CORS 策略长期稳定，且需要统一超时、错误归一化和请求 URL 回传（供 `<DataSourceNote>` 展示）。

#### UI

- 搜索框（对 `search` 参数防抖）+ 「加载更多」游标分页。
- 结果卡片：名称、title、描述、版本、状态徽章（`active` / `deprecated`）、更新时间、仓库链接、官网链接。
- 传输方式徽章：`remotes[].type`（`streamable-http` / `sse`）或 `packages[].registryType`（`npm` / `pypi` / `oci`）。
- **一键生成配置片段**：根据 `remotes` / `packages` 自动拼出可直接粘贴的 `mcp.json`，提供 Cursor / Claude Desktop 两种格式切换 + 复制按钮。这是本工具的核心价值——把「找到 server」和「装上 server」之间的手工步骤消掉。
- 详情抽屉：调用 `/versions` 端点展示历史版本。
- 底部 `<DataSourceNote>`。

---

### 4.4 JS 代码编辑器 `/tools/js-playground`

#### 编辑器选型：CodeMirror 6

| | CodeMirror 6 | Monaco |
| --- | --- | --- |
| 打包体积 | ~50–200 KB（可 tree-shake） | 2–5 MB gzip |
| 构建复杂度 | 普通 ES 模块，动态 import 即可 | 需 worker 配置，与 Next.js 集成麻烦 |
| 移动端 | 良好 | 基本不可用 |
| TS IntelliSense | 无 | 有 |

对博客上的小工具，Monaco 的体积代价远超收益（Replit 的实践是它让不含编辑器的页面也一起变慢）。**选 CodeMirror 6**，通过 `@uiw/react-codemirror`（v4.25.11，peer 依赖 `react >=17`，兼容 React 19）接入。

必须用 `next/dynamic({ ssr: false })` 加载——CodeMirror 依赖 DOM，SSR 会直接报错。

#### 执行沙箱

**绝不使用 `eval()` 或 `new Function()`**（同源执行，可访问 `localStorage` 里的 `adminToken`、可发起带 Cookie 的同源请求）。

方案：**跨源 iframe 沙箱**

```tsx
<iframe ref={frameRef} sandbox="allow-scripts" srcDoc={runnerHtml} />
```

关键点：

- `sandbox="allow-scripts"` 但**不带** `allow-same-origin` → iframe 处于不透明源（opaque origin），无法访问父页面 DOM、Cookie、`localStorage`，也无法向本站发同源请求。
- runner HTML 内劫持 `console.log/warn/error/info/table`，序列化参数后 `postMessage` 给父窗口。
- 父窗口监听 `message`，**必须校验 `event.source === frameRef.current.contentWindow`** 再采信——不透明源的 `event.origin` 是字符串 `"null"`，不能作为唯一凭据。
- 一并捕获 `window.onerror` 与 `unhandledrejection`。
- **看门狗**：父窗口 3 秒未收到「执行完成」消息即销毁 iframe，防死循环卡死浏览器。每次运行重建 iframe，保证干净状态。

#### 功能

- 语法高亮 + 自动补全 + 括号匹配：`@codemirror/lang-javascript` + `basicSetup`；主题 `@codemirror/theme-one-dark`。
- 「运行」（`Ctrl/Cmd + Enter`）+ 「清空控制台」。
- 控制台面板：按 `log` / `warn` / `error` 分色，对象展开为可折叠树（自写递归渲染，不引 `react-json-view`）。
- 示例片段下拉：数组方法、Promise/async、闭包、正则、`Intl` 格式化等。
- 分享：代码 Base64 编码进 URL hash（`#code=...`），打开时自动还原。
- 草稿自动存 `localStorage`。
- P2 可选：Prettier standalone 格式化（约 300 KB，按需 `import()`）。

---

## 5. 第三方来源标注组件（硬性要求）

`components/tools/DataSourceNote.tsx`——凡 `ToolMeta.dataSource` 存在的工具，详情页底部统一渲染：

```
┌─ 数据来源 ────────────────────────────────────────────┐
│ 服务商    Open-Meteo ↗                                │
│ 文档      https://open-meteo.com/en/docs ↗            │
│ 接入方式  服务端代理（Next.js Route Handler），        │
│           响应缓存 600 秒                              │
│ 鉴权      无需 API Key，无需注册                       │
│ 端点      GET https://api.open-meteo.com/v1/forecast  │
│           GET https://geocoding-api.open-meteo.com/…  │
│ 配额      非商业用途 10,000 次/日                      │
│ 许可      CC BY 4.0                                    │
│ 署名      Weather data by Open-Meteo.com ↗            │
├───────────────────────────────────────────────────────┤
│ 本次请求  https://api.open-meteo.com/v1/forecast?…  📋 │
│ 获取时间  2026-08-28 13:45:00 (+08:00)  · 命中缓存     │
└───────────────────────────────────────────────────────┘
```

「本次请求」一栏由 API 响应的 `meta.requestUrl` 动态填充，用户可复制这条 URL 自行验证。这比静态文档更能说清「怎么接入的」。

同时在列表页卡片上显示 `Powered by <provider>` 小字，让依赖关系在浏览阶段就可见。

---

## 6. 依赖变更

```bash
# Markdown → HTML 管线
pnpm add unified remark-parse remark-rehype rehype-stringify rehype-sanitize

# 代码编辑器（peer 依赖需显式安装，pnpm 严格模式不会自动提升）
pnpm add @uiw/react-codemirror codemirror \
         @codemirror/state @codemirror/view \
         @codemirror/lang-javascript @codemirror/theme-one-dark

# 二维码（Wave 5）
pnpm add qrcode && pnpm add -D @types/qrcode

# 服务端 Transform（依赖不进入浏览器 bundle）
pnpm add js-yaml prettier sql-formatter
pnpm add -D @types/js-yaml
```

已有可复用、**无需新增**的依赖：`remark-gfm`、`rehype-raw`、`rehype-highlight`、`rehype-slug`、`react-markdown`、`zod`。

**§8 中标记为「无依赖」的工具优先使用浏览器原生 API**：`JSON`、`TextEncoder`、`btoa/atob`、`URLSearchParams`、`crypto.subtle`、`crypto.randomUUID`、`Intl`、`Canvas`、`FileReader`、`RegExp`。但“无依赖”不等同于“必须纯浏览器实现”，仍可根据资源限制、安全边界与复用需求迁移到服务端。

体积影响：列表页和本地 TransformTool 不引入重型依赖；CodeMirror 仅在 `/tools/js-playground` 动态加载；unified 管线仅在 `/tools/markdown-to-html` 使用；`js-yaml`、`prettier`、`sql-formatter` 只进入服务端 Route Handler。**对首页和文章页首屏零影响。**

---

## 7. 安全性

### 7.1 Markdown 工具的 XSS

预览区用 `dangerouslySetInnerHTML`。内容来自用户自己输入，理论上只构成 self-XSS，但站点 `localStorage` 里存有管理员 token，仍需防护：

- `rehype-sanitize` **默认开启**。
- 「允许原始 HTML」是显式开关，开启时界面给出明确风险提示，且此时才启用 `rehype-raw`。
- 导出的自包含 HTML 文件不受影响（本地打开，独立源）。

### 7.2 JS Playground

见 §4.4：跨源 iframe + 不带 `allow-same-origin` + `event.source` 校验 + 3 秒看门狗。

### 7.3 API 代理滥用

`/api/tools/weather` 与 `/api/tools/mcp/registry` 是无鉴权的外部请求代理，存在被当作跳板刷第三方配额的风险（Open-Meteo 免费额度仅 10k/日）：

- 参数严格校验（`zod`：`lat` ∈ [-90, 90]、`lon` ∈ [-180, 180]、`q` 长度 ≤ 64、`limit` ≤ 100）。
- 依赖 Next.js `revalidate` 缓存吸收重复请求。
- 内存级简易限流（按 IP，60 秒 30 次），足以挡住无意的循环调用。
- 上游请求统一 8 秒超时（`AbortSignal.timeout`）。

### 7.4 已跟进

§2.4 的 `/api/mcp/tools`、`/api/mcp/execute` 已删除。

---

## 8. 工具总清单

### 图例

- **实现方式**：`Transform` = 用 §3.1 抽象，写个纯函数即可；`定制` = 需要独立交互 UI
- **状态**：`✅ 首批实现` / `📋 规划中`（列表页占位展示）

### 8.1 编码转换（encode）

| 工具 | slug | 实现方式 | 依赖 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| JSON 格式化 / 校验 / 压缩 | `json-formatter` | Transform | 无 | ✅ | 错误定位到行列，支持转义/反转义 |
| JSON → TypeScript 接口 | `json-to-ts` | Transform | 无 | ✅ | 递归推断类型，可选 optional 化 |
| Base64 编解码 | `base64` | Transform | 无 | ✅ | `TextEncoder` 正确处理中文；支持文件转 Data URL |
| URL 编解码 / 查询参数解析 | `url-tools` | Transform | 无 | ✅ | `URLSearchParams` 表格化编辑 |
| 进制转换 | `radix` | Transform | 无 | ✅ | 2/8/10/16 及任意进制互转 |
| HTML 实体编解码 | `html-entity` | Transform | 无 | ✅ | DOM 反解 + 命名实体表 |
| JWT 解码 | `jwt-decoder` | Transform | 无 | ✅ | **仅解码 header/payload，不验签**，界面明示 |
| CSV ↔ JSON | `csv-json` | Transform | 无 | ✅ | 自写解析器（处理引号转义、换行） |
| YAML ↔ JSON | `yaml-json` | Transform（服务端） | `js-yaml` | ✅ | 依赖仅进入服务端，不增加浏览器包体 |
| Unicode / 转义字符 | `unicode` | Transform | 无 | ✅ | `\uXXXX`、emoji 码点、零宽字符检测 |

### 8.2 文本处理（text）

| 工具 | slug | 实现方式 | 依赖 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| **Markdown 转 HTML** | `markdown-to-html` | 定制 | unified 系 | ✅ **重点** | 普通/炫酷双模式 + 六种导出，见 §4.2 |
| 命名风格转换 | `case-converter` | Transform | 无 | ✅ | camelCase / snake_case / kebab / PascalCase / CONSTANT |
| 文本行处理 | `text-ops` | Transform | 无 | ✅ | 去重 / 排序 / 去空行 / 加行号 / 前后缀 / 反转 |
| 字数统计 | `word-count` | Transform | 无 | ✅ | 中英文分别计数 + 阅读时长估算 |
| 文本 Diff 对比 | `text-diff` | 定制 | 无 | ✅ | 自写 LCS 行级 diff，并排高亮 |
| 假文生成 | `lorem` | Transform | 无 | ✅ | Lorem Ipsum + 中文假文，静态词库 |
| 简繁转换 | `zh-convert` | Transform | `opencc-js` | 📋 | 词库体积较大（~1 MB），需按需加载 |
| 汉字转拼音 | `pinyin` | Transform | `pinyin-pro` | 📋 | 需评估依赖体积 |
| 代码格式化 | `code-format` | Transform（服务端） | `prettier` | ✅ | 服务端按需执行，不向浏览器发送 Prettier |
| SQL 格式化 | `sql-format` | Transform（服务端） | `sql-formatter` | ✅ | 服务端执行并限制输入大小与频率 |

### 8.3 时间日期（datetime）

| 工具 | slug | 实现方式 | 依赖 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 时间戳转换 | `timestamp` | 定制 | 无 | ✅ | Unix 秒/毫秒 ↔ 日期，多时区，相对时间 |
| Cron 表达式解释 | `cron` | 定制 | 无 | ✅ | 自写解析 + 自然语言描述 + 未来 N 次执行时间 |
| 日期计算器 | `date-calc` | Transform | 无 | ✅ | 日期加减、区间天数、工作日计算 |
| 时区对照表 | `timezone` | 定制 | 无 | ✅ | `Intl.DateTimeFormat` 多城市并列对照 |

### 8.4 颜色与图像（media）

| 工具 | slug | 实现方式 | 依赖 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 颜色转换 + 对比度 | `color` | 定制 | 无 | ✅ | HEX/RGB/HSL/HSV 互转 + WCAG AA/AAA 对比度检测 |
| 调色板生成 | `palette` | 定制 | 无 | ✅ | 互补/三分/单色方案，HSL 数学推导 |
| 图片压缩 / 格式转换 | `image-compress` | 定制 | 无 | ✅ | Canvas `drawImage` + `toBlob`，质量滑块，WebP/JPEG/PNG |
| 图片转 Data URL | `image-base64` | 定制 | 无 | ✅ | `FileReader`，含体积膨胀提示 |
| 二维码生成 | `qrcode` | 定制 | `qrcode` | ✅ | ~50 KB，容错级别 / 前景色可调，PNG+SVG 下载 |
| 渐变生成器 | `gradient` | 定制 | 无 | ✅ | 可视化调节，输出 CSS |
| SVG 优化 | `svg-optimize` | 定制 | `svgo` | 📋 | svgo 主要面向 Node，需评估浏览器端可行性 |
| 图片裁剪 | `image-crop` | 定制 | 无 | 📋 | 拖拽交互复杂度较高，单独排期 |
| 条形码生成 | `barcode` | 定制 | `jsbarcode` | 📋 | 使用频率待观察 |

### 8.5 开发辅助（dev）

| 工具 | slug | 实现方式 | 依赖 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| **JS 代码编辑器** | `js-playground` | 定制 | CodeMirror | ✅ **重点** | iframe 沙箱执行，见 §4.4 |
| 哈希计算 | `hash` | Transform | 无 | ✅ | `crypto.subtle`：SHA-1/256/384/512。**MD5 需自实现，暂不提供** |
| UUID 生成 | `uuid` | Transform | 无 | ✅ | `crypto.randomUUID()`，支持批量 |
| 正则测试器 | `regex-tester` | 定制 | 无 | ✅ | 实时匹配高亮 + 捕获组表格 + 常用正则速查 |
| 单位换算 | `unit` | Transform | 无 | ✅ | 长度/重量/温度/面积/存储/速度，静态换算表 |
| 随机数 / 随机字符串 | `random` | Transform | 无 | ✅ | `crypto.getRandomValues`，可配字符集，适合生成密码 |
| IP / CIDR 计算器 | `cidr` | Transform | 无 | ✅ | 网段范围、掩码、可用主机数 |
| MD5 哈希 | `md5` | Transform | 无 | 📋 | Web Crypto 不支持，需自实现约 100 行 |
| User-Agent 解析 | `ua-parser` | Transform | `ua-parser-js` | 📋 | 纯正则实现覆盖度不足 |
| 密码强度检测 | `password-strength` | 定制 | `zxcvbn` | 📋 | zxcvbn 词典体积大（~800 KB） |

### 8.6 AI 与数据（ai）

| 工具 | slug | 实现方式 | 依赖 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| **天气查询** | `weather` | 定制 | 无 | ✅ **重点** | Open-Meteo 代理，见 §4.1 |
| **MCP 注册表查询** | `mcp-explorer` | 定制 | 无 | ✅ **重点** | 官方注册表检索 + 配置生成，见 §4.3 |
| Token 计数器 | `token-count` | 定制 | `tiktoken` | 📋 | WASM 体积大，需按需加载 |
| 汇率换算 | `currency` | 定制 | 无 | 📋 | 候选源 frankfurter.app（免 Key），需先验证可用性与配额 |
| Prompt 模板库 | `prompt-library` | 定制 | 无 | 📋 | 内容运营成本 > 开发成本，待想清楚定位 |

### 统计

| | 数量 |
| --- | --- |
| 首批实现（✅） | **37 个**（含 4 个重点工具、3 个服务端 Transform） |
| 规划中占位（📋） | **11 个** |
| 合计 | **48 个** |

其中 22 个走 `TransformTool` 抽象（19 个本地、3 个服务端），其余可用工具采用定制交互 UI。

---

## 9. 实施阶段

| 阶段 | 内容 | 产出 | 预估 |
| --- | --- | --- | --- |
| **P0 脚手架** | `registry.ts`、`transform.ts`、`TransformToolView`、`ToolCard`、`ToolShell`、`DataSourceNote`、`CopyButton`、`CategoryFilter`、`download.ts`、`clipboard.ts`、列表页 + 样式、Header 导航 | 列表页可访问，48 个工具全部以卡片形式呈现（未实现的为占位态） | 1 天 |
| **P1 编码转换批** | §8.1 的 9 个 ✅ 工具 | 9 个工具上线 | 0.5 天 |
| **P2 文本 + 时间批** | §8.2 的 5 个 + §8.3 的 4 个 ✅ 工具 | 9 个工具上线 | 1 天 |
| **P3 开发辅助批** | §8.5 的 6 个 ✅（不含 JS 演练场） | 6 个工具上线 | 1 天 |
| **P4 颜色图像批** | §8.4 的 6 个 ✅ | 6 个工具上线 | 1 天 |
| **P5 天气** | 两个代理路由、WMO 映射表、`WeatherTool`、来源标注接线 | `/tools/weather` | 1 天 |
| **P6 Markdown** | unified 管线、plain/neon 双主题、内联样式导出器、六种导出方式 | `/tools/markdown-to-html` | 1.5 天 |
| **P7 JS 编辑器** | CodeMirror 动态加载、iframe 沙箱、控制台面板、示例片段、URL 分享 | `/tools/js-playground` | 1 天 |
| **P8 MCP** | 注册表代理路由、检索 UI、配置片段生成、版本详情抽屉 | `/tools/mcp-explorer` | 1 天 |
| **P9 打磨** | 每页 `generateMetadata`、OG 图、响应式回归、空/错误/加载态、键盘可达性、sitemap 收录 | — | 0.5 天 |

P0 是所有后续阶段的前置。**P1–P8 完成 P0 后彼此独立，可任意顺序或并行推进。** 建议先做 P0 + P1，尽快让页面有实际内容，再按兴趣推进重点工具。

---

## 10. 验收标准

- [x] `/tools` 列表页按 6 个分类分组展示全部 48 个工具；分类筛选与搜索均可用；`planned` 卡片明显区分且不可点击。
- [ ] Header 中 `Tools` 链接存在，且在 `/tools/*` 任意子页面下正确高亮。
- [ ] TransformTool 抽象验证：任取一个已上线工具，确认新增同类工具确实只需「一个纯函数 + 注册表一条 + 几行 page.tsx」。
- [ ] 编码类工具中文处理正确（Base64 编「中文测试」能正确往返，不出现乱码）。
- [ ] 天气：搜索「杭州」「Hangzhou」「北京」均能命中；当前天气 + 24 小时 + 7 日预报正常渲染；°C/°F 切换生效。
- [ ] 天气页底部展示完整来源标注，含 Open-Meteo 署名链接与本次实际请求 URL（可复制）。
- [ ] Markdown：普通/炫酷两种模式预览差异明显；六种导出方式全部可用；下载的 `.html` 双击打开样式完整；内联样式版粘贴进微信公众号编辑器不掉格式。
- [ ] MCP：注册表搜索有结果并可游标翻页；生成的配置片段可直接粘贴进 `mcp.json` 使用；上游超时能优雅降级为错误提示。
- [ ] JS 编辑器：`console.log` 输出正确；死循环 3 秒内被终止且页面不卡死；沙箱内执行 `window.parent.document` 抛安全错误（验证隔离生效）。
- [ ] `pnpm build` 通过；首页 / 文章页首屏 JS 体积无明显增长。

---

## 附：外部接口速查

```bash
# Open-Meteo 地理编码（支持中文与拼音）
curl "https://geocoding-api.open-meteo.com/v1/search?name=杭州&count=8&language=zh&format=json"

# Open-Meteo 天气预报
curl "https://api.open-meteo.com/v1/forecast?latitude=30.29365&longitude=120.16142\
&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m\
&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset\
&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto&forecast_days=7"

# 官方 MCP 注册表
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=filesystem&limit=20&version=latest"
curl "https://registry.modelcontextprotocol.io/v0.1/servers/io.modelcontextprotocol%2Feverything/versions"
```

以上三个接口均于 2026-08-28 实际请求验证通过。
