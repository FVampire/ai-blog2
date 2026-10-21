// Bump the shots-rN directory whenever screenshots change: same URLs are served stale from image caches.
// Curated Moyun feature gallery. `shot` is a file in /projects/moling/shots-r6 (1240w) and
// /projects/moling/shots-r6/full (2400w); sizes are the 1240w intrinsic dimensions.
export type Shot = { shot: string; w: number; h: number; title: string; caption: string };
export type Group = { id: string; label: string; intro: string; shots: Shot[] };

export const GROUPS: Group[] = [
  {
    id: 'planning',
    label: '章节规划',
    intro: '动笔之前先规划：读约束、定人物、排节拍、安排伏笔、做预检，最后形成一张可编辑的细纲卡。',
    shots: [
      { shot: 'outline-plan-constraints', w: 1240, h: 885, title: '读取约束', caption: '卷纲目标、事件池里的必须 / 不得发生、上一章结尾与到期伏笔，逐条核对。' },
      { shot: 'outline-plan-casting', w: 1240, h: 885, title: '拟定出场人物', caption: '必要、可选、本章不出场分开列出，每个决定都附理由。' },
      { shot: 'outline-plan-beats', w: 1240, h: 885, title: '情节节拍', caption: '先出骨架再填内容：地点、人物、冲突、结果与字数，节拍之间有因果箭头。' },
      { shot: 'outline-plan-seeds', w: 1240, h: 885, title: '伏笔动作', caption: '本章埋设、推进、回收各一项；超出上限的伏笔暂缓并说明原因。' },
      { shot: 'outline-plan-preflight', w: 1240, h: 885, title: '一致性预检', caption: '检出林妙妙仍在丹房，自动补入送药后赶到水房的过渡。' },
      { shot: 'outline-plan-confirm', w: 1240, h: 885, title: '确认细纲', caption: '节拍、字数、伏笔动作与人物汇总成可编辑细纲，确认后进入竞选。' },
    ],
  },
  {
    id: 'characters',
    label: '人物',
    intro: '每个角色都有档案、可以对话试人设、能沿章节逐章回溯；所有事实都有来源章节。',
    shots: [
      { shot: 'characters', w: 1240, h: 849, title: '人物图鉴', caption: '六位主要人物的水墨立绘与定位，其余人物在下方索引。' },
      { shot: 'character-profile', w: 1240, h: 849, title: '角色档案', caption: '外貌、性格、能力、当前状态与出场计划。' },
      { shot: 'character-dialogue', w: 1240, h: 849, title: '角色对话', caption: '和角色直接对话，用引导式提问检验人设是否站得住。' },
      { shot: 'character-snapshots', w: 1240, h: 849, title: '回溯与快照', caption: '111 章连续时间轴，任选两章逐项对比九类状态，每处变化都标注来源章节。' },
      { shot: 'character-facts', w: 1240, h: 849, title: '角色 Canon', caption: '李稳 69 条事实按身份、境界、物品、关系等分轨排布；演变用连线串起，冲突单独提示待确认。' },
      { shot: 'character-relations', w: 1240, h: 849, title: '角色关系', caption: '关系列表与编辑面板，称谓与亲疏随剧情更新。' },
      { shot: 'relations-network', w: 1240, h: 849, title: '人物关系网络', caption: '以主角为中心展开的关系网。' },
    ],
  },
  {
    id: 'outline',
    label: '大纲',
    intro: '故事地图、卷纲、事件池和未来构想在同一个工作台里：远处的想法可以一步步落到具体章节。',
    shots: [
      { shot: 'outline-map', w: 1240, h: 849, title: '故事地图', caption: '六条故事弧各占一条泳道，跨越已写、当前与未来区；伏笔以弧线连接埋设与回收。' },
      { shot: 'outline-events', w: 1240, h: 849, title: '事件池', caption: '必须 / 不得 / 候选 / 已排期 / 已完成五列，下方是第 112–121 章的排期与每章容量。' },
      { shot: 'outline-events-drag', w: 1240, h: 849, title: '拖拽排期', caption: '把候选事件拖到章节，超出每章上限时给出警告。' },
      { shot: 'outline-future', w: 1240, h: 849, title: '未来构想', caption: '构想按萌芽、成形、可晋升分级；选中即可填写推进目标与判据并评估影响。' },
      { shot: 'outline-vertical', w: 1240, h: 849, title: '纵向大纲', caption: '总纲 → 卷 → 故事弧 → 章节，已写、当前、未来三段分明。' },
      { shot: 'outline-volume', w: 1240, h: 849, title: '卷纲', caption: '卷名、卷目标、卷主题与本卷故事弧。' },
      { shot: 'outline-versions', w: 1240, h: 849, title: '大纲版本', caption: '每次级联改动前自动留快照，可预览、可撤销。' },
    ],
  },
  {
    id: 'onboarding',
    label: '新建作品',
    intro: '和墨韵聊几轮：每个问题都给出可点选的答案，右侧的作品蓝图随回答逐步成形，最后生成结构化定盘提案。',
    shots: [
      { shot: 'onboarding-chat-1', w: 1240, h: 849, title: '故事种子', caption: '点选一个基调，也可以自由输入想写的世界。' },
      { shot: 'onboarding-chat-2', w: 1240, h: 849, title: '对话与实时蓝图', caption: '主角与起点随回答写进右侧的作品蓝图。' },
      { shot: 'onboarding-chat-3', w: 1240, h: 849, title: '五轮回答完成', caption: '冲突、世界规则、篇幅与读者承诺逐项填满。' },
      { shot: 'onboarding-chat-4', w: 1240, h: 849, title: '结构化定盘提案', caption: '三卷目标与承诺、长线弧、远期与终局节点，都可直接编辑。' },
      { shot: 'onboarding-snapshot', w: 1240, h: 849, title: '初始快照', caption: '创建前核对主角的起始地点、物品、关系、信息与承诺。' },
      { shot: 'onboarding-created', w: 1240, h: 849, title: '新作入架', caption: '《明日邮局》带着三卷规划进入书架首位。' },
    ],
  },
  {
    id: 'settings',
    label: '设置',
    intro: '模型来源、任务分工、竞选与写作边界都可以配置，每一次调用都有记录。',
    shots: [
      { shot: 'settings-sources', w: 1240, h: 849, title: '模型源', caption: '主源与备用源的状态、延迟、用量与余额，故障时自动回退。' },
      { shot: 'settings-slots', w: 1240, h: 849, title: '模型分工', caption: '主笔、规划、评审、快速、向量五个槽位，各自配置窗口、并发与单价。' },
      { shot: 'settings-contest', w: 1240, h: 849, title: '竞选与评分', caption: '参与竞选的模型、并行数与四项评分权重。' },
      { shot: 'settings-shortcuts', w: 1240, h: 849, title: '快捷键与浮标', caption: '全局速记快捷键、浮标位置与透明度。' },
      { shot: 'settings-logs', w: 1240, h: 849, title: '日志与诊断', caption: '工作区健康检测与按级别着色的日志查看器。' },
    ],
  },
  {
    id: 'notes',
    label: '灵感与 Canon',
    intro: '灵感随时记：快捷键或桌面浮标唤起速记，自动打标签并建议关联；Canon 状态中心维护整本书的世界记忆。',
    shots: [
      { shot: 'inspiration-fab', w: 1240, h: 775, title: '桌面浮标', caption: '在任何应用里，桌边的墨韵浮标都可以新建便签、语音或截图记一笔。' },
      { shot: 'inspiration-quick', w: 1240, h: 775, title: '快捷键速记', caption: 'Ctrl+Shift+Space 唤起置顶速记窗：自动识别 #伏笔 #人物，并建议关联作品、章节与人物。' },
      { shot: 'inspiration', w: 1240, h: 849, title: '灵感便签板', caption: '瀑布流、看板、时间轴三种视图；可转为未来构想、插入当前章节或关联伏笔。' },
      { shot: 'canon', w: 1240, h: 849, title: 'Canon 状态中心', caption: '实体浏览器、实体详情与审阅工作台三栏：1,053 个实体、2,737 条事实、23 项待审。' },
      { shot: 'canon-review', w: 1240, h: 849, title: '提及审阅与合并', caption: '新出现的称呼按相似度给出合并候选，并附原文证据。' },
      { shot: 'canon-conflict', w: 1240, h: 849, title: '冲突处理', caption: '能力边界冲突按优先级提示，保留两处证据等待作者确认。' },
      { shot: 'foreshadow', w: 1240, h: 849, title: '伏笔看板', caption: '埋设 → 推进 → 回收三栏，回收率一目了然。' },
      { shot: 'tasks', w: 1240, h: 849, title: '任务中心', caption: '工作流运行记录与多模型调用统计。' },
    ],
  },
];

export const FLOW_SHOTS = {
  stream: { shot: 'competition-stream-detail', w: 1240, h: 567 },
  wait: { shot: 'competition-wait-detail', w: 1240, h: 567 },
  review: { shot: 'competition-review-detail', w: 1240, h: 442 },
  winner: { shot: 'competition-winner-detail', w: 1240, h: 539 },
  context: { shot: 'context', w: 1240, h: 885 },
  writing: { shot: 'writing', w: 1240, h: 885 },
  revised: { shot: 'revised', w: 1240, h: 885 },
  memory: { shot: 'memory', w: 1240, h: 885 },
  complete: { shot: 'complete', w: 1240, h: 885 },
};
