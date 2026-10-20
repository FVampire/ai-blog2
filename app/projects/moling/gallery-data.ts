// Curated Moyun feature gallery. `shot` is a file in /projects/moling/shots (1240w) and
// /projects/moling/shots/full (2400w); sizes are the 1240w intrinsic dimensions.
export type Shot = { shot: string; w: number; h: number; title: string; caption: string };
export type Group = { id: string; label: string; intro: string; shots: Shot[] };

export const GROUPS: Group[] = [
  {
    id: 'characters',
    label: '人物',
    intro: '每个角色都有档案、可以对话试人设、有随章节变化的状态快照，生成时自动引用。',
    shots: [
      { shot: 'characters', w: 1240, h: 775, title: '人物图鉴', caption: '六位主要人物的水墨立绘与定位，其余人物在下方索引。' },
      { shot: 'character-profile', w: 1240, h: 775, title: '角色档案', caption: '外貌、性格、能力、当前状态与出场计划。' },
      { shot: 'character-dialogue', w: 1240, h: 775, title: '角色对话', caption: '和角色直接对话，用引导式提问检验人设是否站得住。' },
      { shot: 'character-snapshots-detail', w: 1240, h: 812, title: '回溯与快照', caption: '选择第 30 / 60 / 90 / 111 章，逐项对比角色当时与现在。' },
      { shot: 'character-relations', w: 1240, h: 775, title: '角色关系', caption: '关系列表与编辑面板，称谓与亲疏随剧情更新。' },
      { shot: 'character-facts', w: 1240, h: 775, title: '角色 Canon', caption: '与该角色有关的全部事实，按章节排成时间线。' },
      { shot: 'relations-network', w: 1240, h: 775, title: '人物关系网络', caption: '以主角为中心展开的关系网，线的粗细是共同出场的章数。' },
    ],
  },
  {
    id: 'outline',
    label: '大纲',
    intro: '总纲、卷纲、事件池和未来构想在同一个工作台里：远处的想法可以一步步落到具体章节。',
    shots: [
      { shot: 'outline-vertical', w: 1240, h: 775, title: '纵向大纲', caption: '总纲 → 卷 → 故事弧 → 章节，已写、当前、未来三段分明。' },
      { shot: 'outline-map', w: 1240, h: 775, title: '故事地图', caption: '同一份大纲的地图视图，看清故事弧之间的走向。' },
      { shot: 'outline-volume', w: 1240, h: 775, title: '卷纲', caption: '卷名、卷目标、卷主题与本卷故事弧。' },
      { shot: 'outline-events-detail', w: 1240, h: 485, title: '事件池', caption: '必须发生 / 不得发生 / 已排期 / 未排期，拖到章节即可排期。' },
      { shot: 'outline-future', w: 1240, h: 775, title: '未来构想', caption: '还没想好放在哪里的点子，成熟后一键晋升进规划池。' },
      { shot: 'outline-versions', w: 1240, h: 775, title: '大纲版本', caption: '每次级联改动前自动留快照，可预览、可撤销。' },
    ],
  },
  {
    id: 'onboarding',
    label: '新建作品',
    intro: '从一个模糊的念头开始：引导式问答或者直接丢材料，系统给出三个方向供你选择。',
    shots: [
      { shot: 'onboarding-0', w: 1240, h: 775, title: '选择类型', caption: '仙侠、悬疑、都市、科幻……先定一个大方向。' },
      { shot: 'onboarding-1', w: 1240, h: 775, title: '引导式问答', caption: '立意、主题、主角、世界、冲突，一问一答把念头说清。' },
      { shot: 'onboarding-material', w: 1240, h: 775, title: '直接丢材料', caption: '已有片段、设定或灵感，整段贴进来也能开始。' },
      { shot: 'onboarding-2', w: 1240, h: 775, title: '三个作品方向', caption: '同一颗种子长出三种走向，选一个最想写的。' },
      { shot: 'onboarding-created', w: 1240, h: 775, title: '作品创建完成', caption: '种子、方向与首卷目标一起进入书斋。' },
    ],
  },
  {
    id: 'notes',
    label: '灵感与追踪',
    intro: '灵感随手记，伏笔、Canon 与任务在后台持续追踪。',
    shots: [
      { shot: 'inspiration', w: 1240, h: 775, title: '灵感便签', caption: '随手记、贴标签、关联人物与章节，再转为未来构想。' },
      { shot: 'foreshadow', w: 1240, h: 775, title: '伏笔看板', caption: '埋设 → 推进 → 回收三栏，回收率一目了然。' },
      { shot: 'canon', w: 1240, h: 775, title: 'Canon 状态中心', caption: '实体的当前状态与变更时间线。' },
      { shot: 'tasks', w: 1240, h: 775, title: '任务中心', caption: '工作流运行记录与多模型调用统计。' },
      { shot: 'library', w: 1240, h: 775, title: '书斋', caption: '作品、今日落笔与写作热力。' },
      { shot: 'night', w: 1240, h: 775, title: '夜读模式', caption: '深色主题下继续写。' },
    ],
  },
];

export const FLOW_SHOTS = {
  stream: { shot: 'competition-stream-detail', w: 1240, h: 567 },
  wait: { shot: 'competition-wait-detail', w: 1240, h: 567 },
  review: { shot: 'competition-review-detail', w: 1240, h: 442 },
  winner: { shot: 'competition-winner-detail', w: 1240, h: 539 },
  context: { shot: 'context', w: 1240, h: 775 },
  outline: { shot: 'flow-outline', w: 1240, h: 775 },
  writing: { shot: 'writing', w: 1240, h: 775 },
  revised: { shot: 'revised', w: 1240, h: 775 },
  memory: { shot: 'memory', w: 1240, h: 775 },
  complete: { shot: 'complete', w: 1240, h: 775 },
};
