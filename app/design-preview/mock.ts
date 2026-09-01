export type ViewId = 'home' | 'article' | 'posts' | 'tags' | 'projects' | 'about';

export const SITE = {
  name: '五月的火',
  tagline: '技术、设计与正在做的事',
  year: '2026',
};

export const NAV: { view: ViewId; label: string }[] = [
  { view: 'posts', label: '文章' },
  { view: 'tags', label: '标签' },
  { view: 'projects', label: '项目' },
  { view: 'about', label: '关于' },
];

export type Post = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  minutes: number;
  tag: string;
  cover: 'ink' | 'ember' | 'moss' | 'clay';
  featured?: boolean;
};

export const posts: Post[] = [
  {
    id: 'study-not-square',
    title: '为什么个人博客还值得做',
    excerpt:
      '信息流把阅读变成扫货。博客反过来：一篇有日期的文章，一个愿意署名的人，读者可以稍后再来。这不是怀旧，是把判断力放回作者这边。',
    date: '2026.08.31',
    minutes: 12,
    tag: '设计',
    cover: 'ember',
    featured: true,
  },
  {
    id: 'measure',
    title: '正文宽度为什么是 65 个字',
    excerpt: '行长不是审美偏好。超过七十五个字，眼睛找不到下一行；短于五十五，节奏被切碎。六十五是中文里比较稳的一段。',
    date: '2026.08.24',
    minutes: 8,
    tag: '排版',
    cover: 'ink',
  },
  {
    id: 'one-featured',
    title: '首页要不要做大图轮播',
    excerpt: '轮播是广告牌语法。博客首页更像一份小刊物的封面：一篇主打，下面是近期目录。读者进来是为了找东西读，不是为了被推销这个网站。',
    date: '2026.08.18',
    minutes: 7,
    tag: '设计',
    cover: 'clay',
  },
  {
    id: 'agent-sign',
    title: '让 Agent 写，但不要让它直接发布',
    excerpt: '提纲、判断、签字留在人这边；补段落、配图、排版可以交给 Agent。协作链一旦省掉校对，博客就会变成内容工厂。',
    date: '2026.08.09',
    minutes: 10,
    tag: '创作',
    cover: 'moss',
  },
  {
    id: 'thin-thick',
    title: '读者看见博客，作者看见印刷所',
    excerpt: '前台该薄：文章、标签、搜索、关于。后台可以厚：草稿、媒体、Agent 接口。技术应该被读者忘掉，被作者记住。',
    date: '2026.07.22',
    minutes: 9,
    tag: '系统',
    cover: 'ink',
  },
  {
    id: 'tide-notes',
    title: '《遗忘潮》开发笔记：世界会忘记你',
    excerpt: '做文字冒险时最大的设计不是地图，是遗忘。NPC 记得你，世界不记得。这篇记下核心循环怎么拆成可玩的几层。',
    date: '2026.06.14',
    minutes: 15,
    tag: '项目',
    cover: 'ember',
  },
  {
    id: 'from-feed',
    title: '从信息流里把桌子搬出来',
    excerpt: '把个人站点做成产品主页，是另一条歧路。博客不需要 onboarding，不需要留存曲线。它需要一篇篇能被链出去的文章。',
    date: '2025.12.04',
    minutes: 6,
    tag: '随笔',
    cover: 'clay',
  },
  {
    id: 'not-a-product',
    title: '个人站点不必像产品',
    excerpt: '少做功能，多写文章。搜索、标签、RSS 够用。其余的，等真有一篇写不下去的时候再加。',
    date: '2025.09.16',
    minutes: 5,
    tag: '随笔',
    cover: 'moss',
  },
];

export const featured = posts.find((p) => p.featured)!;
export const latest = posts.filter((p) => !p.featured);

export const tags = [
  { name: '设计', count: 2 },
  { name: '排版', count: 1 },
  { name: '创作', count: 1 },
  { name: '系统', count: 1 },
  { name: '项目', count: 1 },
  { name: '随笔', count: 2 },
];

export const article = {
  ...featured,
  author: '五月的火',
  sections: [
    {
      id: 'why',
      title: '博客解决什么问题',
      paragraphs: [
        '刷不完的流训练的是停留，不是读完。标题、封面、点赞数，都在替你决定下一秒看什么。个人博客把决定权还回去：这是我写的，这是写于哪一天，你要不要花十二分钟。',
        '所以首页不是笔记堆，也不是阅读器。它是一份在更新的刊物：有刊名、有主打、有目录。读者进来，先看见最近在写什么。',
      ],
    },
    {
      id: 'home',
      title: '首页长什么样',
      paragraphs: [
        '一篇主打文章占上半屏，下面是近期文章的目录：标题、日期、标签、一段摘要。侧栏放作者、标签和订阅。这是博客用了二十年的结构，不是因为没创意，是因为它回答了读者的三个问题：这是谁的站、最近写了什么、我从哪篇开始。',
        '主打可以换，目录必须在。只推一篇、把其余藏起来，站点会变成私人摘录，而不是可以链给别人的博客。',
      ],
      quote: '博客是一份署名的刊物，不是一间上锁的书房。',
    },
    {
      id: 'page',
      title: '文章页',
      paragraphs: [
        '点进一篇，才进入阅读。标题、作者、日期、标签都在，正文保持舒适的行宽。读完之后给出同站的其他文章，以及一处安静的评论。没有点赞条，没有无限相关推荐。',
        '后台可以很厚：草稿、媒体库、Agent 协作。那是作者的印刷所，不必摆在读者进门的地方。',
      ],
    },
  ],
  comments: [
    {
      name: '林可',
      date: '2026.09.01',
      body: '同意首页得能看见最近在写什么。只放一篇的时候，我以为这是个未完成的站点。',
    },
    {
      name: '阿宁',
      date: '2026.08.31',
      body: 'Agent 不直接发布这条，值得写进编辑规范里。',
    },
  ],
};

export const projects = [
  {
    name: '遗忘潮',
    year: '2026',
    blurb: '文字冒险。世界会忘记你，同伴会记得你。',
    href: 'work',
  },
  {
    name: '墨灵',
    year: '2025',
    blurb: '把一次生成，拆成可以回放的流水线。',
    href: 'work',
  },
];

export const about = {
  name: '五月的火',
  role: '工程师，偶尔写博客',
  bio: [
    '写技术、设计和正在做的项目。这个站是对外的刊物，不是私人笔记备份。',
    '文章按日期发布，用标签归类，用 RSS 订阅。项目有单独的一栏，不和文章抢同一条时间线。',
  ],
};
