const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'public/projects/moling/video');
const tempDir = path.join(root, '.tmp/moling-demo-video-ass');
const assPath = path.join(tempDir, 'agent-pipeline.ass');
const mp4Path = path.join(outputDir, 'complete-workflow-v1.mp4');
const webmPath = path.join(outputDir, 'complete-workflow-v1.webm');
const posterPath = path.join(outputDir, 'complete-workflow-v1-poster.png');

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const duration = 27.5;
const events = [];

const time = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `0:${String(minutes).padStart(2, '0')}:${rest.toFixed(2).padStart(5, '0')}`;
};

const clean = (value) => value.replaceAll('\\', '\\\\').replaceAll('{', '\\{').replaceAll('}', '\\}').replaceAll('\n', '\\N');

function dialogue(start, end, style, text, layer = 2) {
  events.push(`Dialogue: ${layer},${time(start)},${time(end)},${style},,0,0,0,,${text}`);
}

function label(start, end, x, y, text, options = '', layer = 3) {
  dialogue(start, end, 'UI', `{\\pos(${x},${y})\\an7${options}}${clean(text)}`, layer);
}

function serif(start, end, x, y, text, size = 24, color = '&H00282018&', options = '', layer = 3) {
  dialogue(start, end, 'Serif', `{\\pos(${x},${y})\\an7\\fs${size}\\1c${color}${options}}${clean(text)}`, layer);
}

function box(start, end, x1, y1, x2, y2, color, alpha = '00', radius = 0, layer = 0) {
  const points = radius
    ? `m ${x1 + radius} ${y1} l ${x2 - radius} ${y1} b ${x2} ${y1} ${x2} ${y1} ${x2} ${y1 + radius} l ${x2} ${y2 - radius} b ${x2} ${y2} ${x2} ${y2} ${x2 - radius} ${y2} l ${x1 + radius} ${y2} b ${x1} ${y2} ${x1} ${y2} ${x1} ${y2 - radius} l ${x1} ${y1 + radius} b ${x1} ${y1} ${x1} ${y1} ${x1 + radius} ${y1}`
    : `m ${x1} ${y1} l ${x2} ${y1} l ${x2} ${y2} l ${x1} ${y2}`;
  dialogue(start, end, 'Shape', `{\\p1\\pos(0,0)\\an7\\1c${color}\\1a&H${alpha}&}${points}{\\p0}`, layer);
}

function rule(start, end, x1, y1, x2, y2, color = '&H00C9D5DF&') {
  box(start, end, x1, y1, x2, y2, color, '00', 0, 1);
}

function pill(start, end, x, y, text, color = '&H00406A91&', bg = '&H00E1EDF8&') {
  const width = Math.max(58, text.length * 12 + 18);
  box(start, end, x, y, x + width, y + 25, bg, '00', 10, 1);
  label(start, end, x + 9, y + 7, text, `\\fs11\\b1\\1c${color}`);
}

const stages = [
  [0, 2.8, '01 · 创建项目', '创建你的长篇项目', '建立作品边界与本地创作空间'],
  [2.8, 5.5, '02 · 章节目标', '第七章 · 灯册', '理解目标并选择故事上下文'],
  [5.5, 9, '03 · AI 输出细纲', '生成章节细纲', '生成场景、节拍、约束与验收标准'],
  [9, 13, '04 · 多模型竞态', '三路候选同时生成', '比较文笔、结构与一致性'],
  [13, 21, '05 · AI 输出正文', '第七章 · 灯册', '按确认细纲将优胜稿写入编辑器'],
  [21, 24, '06 · 审稿与修订', '一致性审阅', '只修改发生冲突的句子'],
  [24, duration, '07 · 定稿与同步', '第七章 · 灯册', '同步摘要、角色状态、Canon 与影响通知'],
];

// Persistent application chrome.
box(0, duration, 0, 0, 1280, 720, '&H00E8F1F6&');
box(0, duration, 0, 0, 1280, 42, '&H00F2F8FB&');
box(0, duration, 0, 42, 198, 720, '&H00D8E6EF&');
box(0, duration, 942, 42, 1280, 720, '&H00DDE9F1&');
rule(0, duration, 0, 41, 1280, 42, '&H00B8CBD9&');
rule(0, duration, 197, 42, 198, 720, '&H00B8CBD9&');
rule(0, duration, 941, 42, 942, 720, '&H00B8CBD9&');

box(0, duration, 16, 17, 24, 25, '&H004B60AE&', '00', 4, 2);
box(0, duration, 29, 17, 37, 25, '&H004D8EB1&', '00', 4, 2);
box(0, duration, 42, 17, 50, 25, '&H006E805F&', '00', 4, 2);
label(0, duration, 62, 14, '墨灵 Moling', '\\fs14\\b1\\1c&H003A3028&');
label(0, 2.8, 176, 15, '创作项目 / 新项目', '\\fs10\\1c&H00695F57&');
label(2.8, duration, 176, 15, '创作项目 / 南岸无灯', '\\fs10\\1c&H00695F57&');
label(0, duration, 1163, 15, '●  本地自动保存', '\\fs9\\b1\\1c&H005F724D&');

label(0, duration, 18, 62, 'LONGFORM PROJECT', '\\fs9\\b1\\fsp2\\1c&H00437BA1&');
serif(0, 2.8, 18, 82, '尚未创建', 20, '&H0070665C&');
serif(2.8, duration, 18, 82, '南岸无灯', 21);
rule(0, duration, 14, 112, 184, 113, '&H00B8CAD8&');
label(0, duration, 22, 129, '创作空间', '\\fs9\\fsp2\\1c&H00778A9A&');

const nav = [['✦', '章节工作台'], ['⌁', '全书大纲'], ['◇', '角色与世界'], ['✓', '任务中心']];
nav.forEach(([icon, title], index) => {
  const y = 153 + index * 38;
  if (index === 0) box(0, duration, 12, y - 7, 186, y + 25, '&H00B7D4E5&', '00', 6, 1);
  label(0, duration, 21, y, icon, '\\fs12\\1c&H004B82AA&');
  label(0, duration, 47, y, title, `${index === 0 ? '\\b1\\1c&H00194260&' : '\\1c&H006C625B&'}\\fs11`);
});

rule(2.8, duration, 14, 310, 184, 311, '&H00B8CAD8&');
label(2.8, duration, 20, 327, '卷一 · 入城', '\\fs10\\b1\\1c&H00574B40&');
label(2.8, duration, 24, 357, '第006章 · 夜班记录', '\\fs10\\1c&H007A7068&');
box(2.8, duration, 14, 382, 185, 433, '&H00C6D9E8&', '00', 4, 1);
rule(2.8, duration, 14, 382, 16, 433, '&H004E8AB3&');
label(2.8, duration, 24, 391, '第007章 · 灯册', '\\fs11\\b1\\1c&H001E4260&');
label(2.8, duration, 24, 412, '当前章节 · 规划中', '\\fs8\\1c&H006B594A&');
label(2.8, duration, 24, 451, '第008章 · 尚未命名', '\\fs10\\1c&H007A7068&');

// Persistent right panel shell.
label(0, duration, 962, 64, 'AI 协作', '\\fs14\\b1\\1c&H00342D27&');
label(0, 2.8, 1195, 66, '等待项目', '\\fs9\\1c&H007B6E63&');
label(2.8, 13, 1195, 66, '● 运行中', '\\fs9\\b1\\1c&H005B755C&');
label(13, 21, 1182, 66, '● 逐字写入', '\\fs9\\b1\\1c&H005B755C&');
label(21, 24, 1192, 66, '1 项建议', '\\fs9\\b1\\1c&H00485C98&');
label(24, duration, 1182, 66, '✓ 同步完成', '\\fs9\\b1\\1c&H005B755C&');
rule(0, duration, 958, 92, 1262, 93, '&H00B8CBD9&');
box(0, duration, 958, 109, 1263, 171, '&H00DFEDF7&', '00', 6, 1);
label(0, duration, 971, 120, '当前任务', '\\fs8\\fsp1\\1c&H0040799E&');

// Stage-specific headings and current tasks.
stages.forEach(([start, end, stage, title, task]) => {
  label(start, end, 226, 61, start === 0 ? 'PROJECT SETUP' : start < 5.5 ? 'CHAPTER GOAL' : start < 9 ? 'CHAPTER OUTLINE' : start < 13 ? 'MULTI-MODEL RACE' : start < 21 ? 'CHAPTER DRAFT' : start < 24 ? 'REVIEW & REVISION' : 'FINALIZE & SYNC', '\\fs9\\b1\\fsp2\\1c&H004078A4&');
  serif(start, end, 226, 81, title, 23);
  pill(start, end, 780, 66, stage);
  label(start, end, 971, 141, task, '\\fs11\\b1\\1c&H003A3028&');
});
rule(0, duration, 222, 120, 916, 121, '&H00C5D4DF&');

// 01. Project creation modal and controlled field typing.
box(0, 2.8, 0, 42, 1280, 720, '&H002F2A25&', '88', 0, 6);
box(0, 2.8, 380, 126, 900, 604, '&H00EFF7FB&', '00', 12, 7);
label(0, 2.8, 410, 158, 'NEW LONGFORM PROJECT', '\\fs9\\b1\\fsp2\\1c&H003F79A6&', 8);
serif(0, 2.8, 410, 181, '创建创作项目', 26, '&H00282018&', '', 8);
const modalFields = [
  [235, '作品名称', '南岸无灯', .25, .95],
  [317, '类型与规模', '当代奇幻 · 三卷长篇', .85, 1.65],
  [399, '一句话故事', '一座会遗忘街道的城市里，档案员决定哪些记忆值得被写回地图。', 1.35, 2.4],
];
modalFields.forEach(([y, title, value, start, end]) => {
  label(0, 2.8, 410, y, title, '\\fs9\\1c&H006A6571&', 8);
  box(0, 2.8, 410, y + 20, 870, y + 62, '&H00F9FDFF&', '00', 5, 7);
  rule(0, 2.8, 410, y + 20, 870, y + 21, '&H00B8CAD9&');
  const chunks = Math.max(1, Math.ceil(value.length / 3));
  for (let i = 1; i <= chunks; i++) {
    const at = start + (end - start) * ((i - 1) / chunks);
    const until = start + (end - start) * (i / chunks);
    label(at, until, 422, y + 33, value.slice(0, i * 3), '\\fs11\\1c&H00322B26&', 8);
  }
  label(end, 2.8, 422, y + 33, value, '\\fs11\\1c&H00322B26&', 8);
});
box(0, 2.8, 708, 537, 870, 576, '&H0032678E&', '00', 6, 7);
label(0, 2.8, 735, 548, '创建并进入工作台', '\\fs10\\b1\\1c&H00EFF9FF&', 8);

// Context chips shared by the planning stages.
const refs = ['沈晚白 · 档案员', '顾衡 · 作废权', '阿苔 · 湿石子', '伏笔：双重署名', '地点：城北档案库'];
refs.forEach((ref, index) => pill(3.3 + index * .22, 21, 962 + (index % 2) * 145, 190 + Math.floor(index / 2) * 34, ref, '&H005A705D&', '&H00EFF7F1&'));

// 02. Chapter goal.
box(2.8, 5.5, 226, 150, 914, 277, '&H00D9E9F4&', '00', 7, 1);
label(2.8, 5.5, 245, 170, '本章目标', '\\fs9\\b1\\fsp1\\1c&H004078A4&');
serif(2.8, 5.5, 245, 198, '沈晚白在档案库发现自己的名字写成两行，', 17);
serif(3.35, 5.5, 245, 228, '决定是否把南岸那条已经从地图消失的河写回灯册。', 17);
box(3.7, 5.5, 226, 301, 914, 359, '&H00F8FCFF&', '00', 6, 1);
label(3.7, 5.5, 246, 320, '✓  目标已拆解为人物决定、场景证据与章节结果', '\\fs12\\b1\\1c&H00546B57&');

// 03. AI outline, one card at a time.
const beats = [
  ['01', '夜至档案库', '发现灯册异常'],
  ['02', '对读两份笔迹', '确认并非誊写错误'],
  ['03', '顾衡来访', '立场冲突，不新增事实'],
  ['04', '阿苔留下湿石子', '推进“双重署名”伏笔'],
];
beats.forEach(([num, title, desc], index) => {
  const start = 5.7 + index * .65;
  const y = 158 + index * 83;
  box(start, 9, 226, y, 914, y + 68, '&H00F8FCFF&', '00', 6, 1);
  serif(start, 9, 244, y + 18, num, 18, '&H004980A9&');
  label(start, 9, 292, y + 14, title, '\\fs13\\b1\\1c&H00312B27&');
  label(start, 9, 292, y + 38, desc, '\\fs10\\1c&H00695F57&');
  pill(start, 9, 800, y + 20, index === 3 ? '结尾钩子' : '约束通过', '&H005A705D&', '&H00EFF7F1&');
});

// 04. Multi-model race.
box(9, 13, 226, 151, 914, 237, '&H00D9E9F4&', '00', 7, 1);
label(9, 13, 245, 169, '已确认细纲', '\\fs9\\b1\\fsp1\\1c&H004078A4&');
label(9, 13, 245, 196, '夜至档案库  →  对读两份笔迹  →  顾衡来访  →  阿苔留下湿石子', '\\fs12\\b1\\1c&H00352E29&');
const models = [
  ['文笔', '水痕沿着纸页醒来，像河在旧地图背面翻身。'],
  ['结构', '灯册第三十七页，他的名字写了两行。'],
  ['审慎', '顾衡停在门外，先看见那枚仍在滴水的石子。'],
];
models.forEach(([name, copy], index) => {
  const start = 9.25 + index * .5;
  const y = 273 + index * 101;
  const chosen = index === 1;
  box(start, 13, 958, y, 1262, y + 88, chosen ? '&H00D5E7F4&' : '&H00F2FAFF&', '00', 6, 1);
  label(start, 13, 972, y + 12, name, '\\fs11\\b1\\1c&H003A3028&');
  label(start, 11.5, 1198, y + 13, `候选 0${index + 1}`, '\\fs8\\1c&H00746B63&');
  if (chosen) label(11.5, 13, 1198, y + 13, '✓ 已选中', '\\fs8\\b1\\1c&H004D725F&');
  label(start + .25, 13, 972, y + 39, copy, '\\fs9\\1c&H00665D55&');
});
box(11.5, 13, 226, 278, 914, 336, '&H00E5F1E8&', '00', 6, 1);
label(11.5, 13, 247, 297, '✓  结构稿胜出：推进最稳，Canon 冲突最少', '\\fs12\\b1\\1c&H00546B57&');

// 05. Typewriter body. Text is preselected, then replayed at a readable pace.
const prose = [
  '灯册第三十七页，他的名字写了两行。上一行是旧墨，下一行几乎是湿的。',
  '顾衡又一次停在门槛外，像在等他把其中一行涂掉。沈晚白没有动笔。',
  '他只是把阿苔的石子放在两行名字中间，看水痕慢慢洇开，',
  '像一条不肯从地图上退走的河。',
];
const full = prose.join('\n\n');
const chunks = Math.ceil(full.length / 3);
for (let index = 1; index <= chunks; index++) {
  const start = 13.15 + (7.1 * (index - 1)) / chunks;
  const end = 13.15 + (7.1 * index) / chunks;
  serif(start, end, 236, 158, full.slice(0, index * 3), 17, '&H00332920&', '\\q2');
}
serif(20.25, 21, 236, 158, full, 17, '&H00332920&', '\\q2');
box(13, 21, 958, 304, 1262, 393, '&H00D5E7F4&', '00', 6, 1);
label(13, 21, 972, 318, '结构 · 优胜稿', '\\fs11\\b1\\1c&H003A3028&');
label(13, 21, 1189, 318, '正在写入', '\\fs8\\b1\\1c&H004D725F&');
label(13, 21, 972, 348, '正文已预生成并按阅读速度逐字回放，', '\\fs9\\1c&H00665D55&');
label(13, 21, 972, 366, '过程可暂停、可定位，质量与节奏都可控。', '\\fs9\\1c&H00665D55&');

// 06. Review and local revision.
serif(21, 24, 236, 158, full, 17, '&H00332920&', '\\q2');
box(21, 24, 229, 262, 900, 306, '&H00C2D6F4&', '22', 4, 1);
box(21.25, 24, 226, 510, 914, 604, '&H00EBF0FB&', '00', 6, 1);
label(21.25, 24, 245, 528, '一致性建议 · 已应用', '\\fs10\\b1\\1c&H00475B94&');
label(21.25, 24, 245, 554, '候选中的“第一次踏入档案库”与第六章夜班记录冲突，', '\\fs10\\1c&H00655751&');
label(21.25, 24, 245, 574, '已改为“又一次停在门槛外”；其余正文保持不变。', '\\fs10\\b1\\1c&H004D5D6E&');
box(21, 24, 958, 304, 1262, 391, '&H00EBF0FB&', '00', 6, 1);
label(21, 24, 972, 319, '一致性审稿', '\\fs11\\b1\\1c&H003A3028&');
label(21, 24, 1190, 319, '✓ 已应用', '\\fs8\\b1\\1c&H004D725F&');
label(21, 24, 972, 350, '仅修订冲突句，不重写已经成立的段落。', '\\fs9\\1c&H00665D55&');

// 07. Finalize and sync the story memory.
serif(24, duration, 236, 158, full, 17, '&H00332920&', '\\q2');
box(24, duration, 226, 510, 914, 579, '&H00E5F1E8&', '00', 6, 1);
label(24, duration, 245, 527, '✓ 章节已定稿', '\\fs12\\b1\\1c&H00546B57&');
label(24, duration, 245, 552, '第七章《灯册》 · 1,842 字 · 本地版本已保存', '\\fs10\\1c&H00665D55&');
const syncItems = [
  ['章节摘要', '已更新'], ['伏笔 · 双重署名', '推进中'], ['顾衡 · 出场状态', '已对齐'], ['卷二《对岸》影响', '已通知'],
];
syncItems.forEach(([name, state], index) => {
  const start = 24.2 + index * .52;
  const y = 304 + index * 53;
  box(start, duration, 958, y, 1262, y + 43, '&H00E8F2EA&', '00', 5, 1);
  label(start, duration, 972, y + 14, name, '\\fs10\\1c&H005A665E&');
  label(start, duration, 1205, y + 14, state, '\\fs9\\b1\\1c&H004D725F&');
});
box(26.35, duration, 973, 642, 1258, 690, '&H00526443&', '00', 7, 4);
label(26.35, duration, 1001, 658, '✓  世界状态已记住这一章', '\\fs11\\b1\\1c&H00EBF6F9&', 5);

const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: UI,Microsoft YaHei UI,12,&H00352E29&,&H000000FF&,&H00000000&,&H00000000&,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Serif,Microsoft YaHei UI,20,&H00352E29&,&H000000FF&,&H00000000&,&H00000000&,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Shape,Arial,12,&H00FFFFFF&,&H000000FF&,&H00000000&,&H00000000&,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}
`;

fs.writeFileSync(assPath, ass, 'utf8');

function run(args) {
  const result = spawnSync('ffmpeg', args, { stdio: 'inherit', cwd: root });
  if (result.status !== 0) throw new Error(`ffmpeg exited with ${result.status}`);
}

const escapedAss = assPath.replaceAll('\\', '/').replace(':', '\\:');
run(['-y', '-f', 'lavfi', '-i', `color=c=#f6f1e8:s=1280x720:r=25:d=${duration}`, '-vf', `ass='${escapedAss}'`, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4Path]);
run(['-y', '-i', mp4Path, '-an', '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', webmPath]);
run(['-y', '-ss', '18', '-i', mp4Path, '-frames:v', '1', posterPath]);

console.log(`Created ${path.relative(root, mp4Path)}`);
console.log(`Created ${path.relative(root, webmPath)}`);
console.log(`Created ${path.relative(root, posterPath)}`);
