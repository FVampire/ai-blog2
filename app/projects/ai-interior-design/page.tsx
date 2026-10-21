import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import s from './interior.module.css';
import { StyleCompare, ViewerEmbed } from './InteriorShowcase';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import { projectMedia } from '../media';

const BASE = '/projects/ai-interior-design';
const MEDIA = projectMedia(BASE);
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAGE_TITLE = '栖居 · AI 装修设计 - 五月的火';
const PAGE_DESCRIPTION = '从户型识别、需求简报、方案生成到可交互的 3D 交付：栖居把装修沟通从一张效果图，变成一个可以走进去的家。';
const PAGE_IMAGE = `${MEDIA}/shots/01-home-hero.webp`;

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/projects/ai-interior-design` },
  openGraph: {
    type: 'article', title: PAGE_TITLE, description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/projects/ai-interior-design`, siteName: SITE_NAME, locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1800, height: 1125, alt: '栖居 AI 装修设计产品首页' }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESCRIPTION, images: [PAGE_IMAGE] },
};

const problems = [
  ['看图', '一张效果图能打动人，却说不清它和整套户型、动线与收纳的关系。'],
  ['改图', '换个风格就要重新沟通、重新出图，比较几种方向的成本很高。'],
  ['想象', '业主需要自己在脑中拼出完整的家，决定往往建立在猜测之上。'],
];

const steps = [
  {
    no: '01', title: '户型导入', shot: '02-step-import', ratio: [1800, 1623],
    copy: '上传户型图，或从示例户型开始。系统识别 13 个空间的边界与面积，叠加在原始建筑图上逐个标注，给出外轮廓与套内面积。',
    points: ['13 个空间自动分区', '面积表与原图对齐', '外轮廓 10.80 × 9.40 m'],
  },
  {
    no: '02', title: '需求简报', shot: '03-step-brief', ratio: [1800, 1394],
    copy: '用材质板而不是形容词表达风格；再用生活需求标签补充“怎么住”——独立电竞房、四人用餐、充足收纳、柔和夜间照明。',
    points: ['三种风格材质板', '生活需求标签', '一句话补充说明'],
  },
  {
    no: '03', title: '生成方案', shot: '04-step-generating', ratio: [1800, 1544],
    copy: '生成过程被拆成户型解析、空间分区、家具布置、材质与灯光、渲染出图五个阶段，每个阶段都展示真实的中间结果和对应日志。',
    points: ['五阶段可视化', '同机位中间产物', '可随时跳过'],
  },
  {
    no: '04', title: '方案预览', shot: '05-step-result', ratio: [1800, 1524],
    copy: '按所选风格查看全屋总览与各空间效果图，一键进入完整方案页或 3D 漫游；需求不满意时，回到上一步调整即可。',
    points: ['按风格出图', '逐空间切换', '直达方案与 3D'],
  },
];

const processFrames = [
  ['overview-1-clay', '白模', '墙体与结构'],
  ['overview-2-layout', '布局', '家具体块与分区'],
  ['overview-3-material', '材质', '木作、织物与石材'],
] as const;

const facts = [
  ['13', '空间统一建模'],
  ['3', '风格方案'],
  ['28', '张写实效果图'],
  ['4.3MB', '交付模型体积'],
];

const pipeline = [
  ['Blender 场景', '13 个空间统一建模，16 个固定机位，PBR 材质分组'],
  ['Cycles 渲染', 'OptiX GPU · 160 samples · AgX；三种风格由同一份 styles.json 驱动'],
  ['glTF 交付', '1,151 个网格按房间与材质合并为 154 个；Meshopt + WebP，28 MB → 4.3 MB'],
  ['Web 查看器', 'Three.js 运行时套用风格材质；房间聚焦、室内机位、日夜氛围'],
];

export default function InteriorDesignPage() {
  return (
    <div className={s.shell}>
      <Header />
      <main className={s.page}>
        <section className={s.hero}>
          <div className={s.topline}>
            <div><Link href="/">首页</Link><i>/</i><Link href="/projects">项目</Link><i>/</i><span>栖居</span></div>
            <span>AI × SPACE DESIGN · 2026</span>
          </div>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>AI INTERIOR DESIGN · PRODUCT CASE</p>
            <h1>栖居 <i>Qiju</i></h1>
            <h2>在装修之前，<br />先住进未来的家。</h2>
            <p>一个 AI 装修设计产品：从一张户型图出发，经过需求简报与方案生成，最终交付一个可以亲手探索的 3D 方案。</p>
          </div>
          <figure className={s.heroShot}>
            <div className={s.browserBar} aria-hidden="true"><i /><i /><i /><span>qiju · AI 装修设计</span></div>
            <Image src={PAGE_IMAGE} alt="栖居产品首页：让理想的家，提前发生" width={1800} height={1125} priority sizes="(max-width: 900px) 100vw, 1240px" />
          </figure>
          <dl className={s.heroMeta}>
            <div><dt>角色</dt><dd>产品设计 / 交互 / 3D 与渲染 / 前端</dd></div>
            <div><dt>形态</dt><dd>Web 产品原型 + 3D 交付查看器</dd></div>
            <div><dt>样例</dt><dd>120㎡ 两卧电竞之家（示例项目数据）</dd></div>
            <div><dt>技术</dt><dd>Blender · Cycles · glTF · Three.js · Vite</dd></div>
          </dl>
        </section>

        <section className={s.problem}>
          <div className={s.sectionIntro}>
            <span>01 · WHY</span>
            <h2>装修沟通的难点，<br />不在画面，而在空间。</h2>
          </div>
          <div className={s.problemGrid}>
            {problems.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
          <p className={s.problemAnswer}>栖居的回答：<b>同一套模型</b>贯穿识别、生成、出图与 3D 交付，任何一步的选择都能在完整的家里被看见。</p>
        </section>

        <section className={s.flow}>
          <div className={s.sectionHeading}>
            <div><span>02</span><p>PRODUCT FLOW</p></div>
            <h2>四步，从户型到理想生活。</h2>
          </div>
          {steps.map((step, index) => (
            <article key={step.no} className={`${s.step} ${index % 2 ? s.stepReverse : ''}`}>
              <div className={s.stepCopy}>
                <span>{step.no}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
                <ul>{step.points.map((point) => <li key={point}>{point}</li>)}</ul>
              </div>
              <figure className={s.stepShot}>
                <Image unoptimized src={`${MEDIA}/shots/${step.shot}.webp`} alt={`栖居设计工作台 · ${step.title}`} width={step.ratio[0]} height={step.ratio[1]} sizes="(max-width: 900px) 100vw, 820px" />
              </figure>
            </article>
          ))}
        </section>

        <section className={s.process}>
          <div className={s.sectionHeading}>
            <div><span>03</span><p>GENERATION</p></div>
            <h2>“生成过程”里的每一帧，<br />都是真实的中间结果。</h2>
            <p>同一机位依次输出白模、体块布局、材质与最终光照。产品里的生成动画直接使用这些帧，而不是装饰性的加载效果。</p>
          </div>
          <div className={s.processRow}>
            {processFrames.map(([file, title, note], index) => (
              <figure key={file}>
                <Image unoptimized src={`${MEDIA}/renders/${file}.webp`} alt={`生成过程 ${title}`} width={1800} height={1350} sizes="(max-width: 900px) 50vw, 330px" />
                <figcaption><span>0{index + 1}</span><b>{title}</b>{note}</figcaption>
              </figure>
            ))}
            <figure>
              <Image unoptimized src={`${MEDIA}/renders/natural/01-overview.webp`} alt="生成过程 最终渲染" width={1800} height={1350} sizes="(max-width: 900px) 50vw, 330px" />
              <figcaption><span>04</span><b>出图</b>布光与 Cycles 渲染</figcaption>
            </figure>
          </div>
        </section>

        <section className={s.styles}>
          <div className={s.sectionHeading}>
            <div><span>04</span><p>THREE STYLES</p></div>
            <h2>同一个家，三种生活表情。</h2>
            <p>风格不是滤镜：木作、织物、石材与五金分别替换，家电与卫浴金属保持原色。拖动滑块比较任意两种风格。</p>
          </div>
          <StyleCompare />
        </section>

        <section className={s.delivery}>
          <div className={s.sectionHeading}>
            <div><span>05</span><p>DELIVERABLE</p></div>
            <h2>交付的不是一张图，<br />而是一个可以走进去的家。</h2>
            <p>方案页汇总 16 个空间的效果图、面积表、材质与软装清单和设计说明；3D 方案在浏览器中直接打开，可切换风格、聚焦房间、进入室内视角和夜间氛围。</p>
          </div>
          <ViewerEmbed />
          <div className={s.deliveryGrid}>
            <figure><Image unoptimized src={`${MEDIA}/shots/08-project-header.webp`} alt="方案详情页：全屋总览与俯视平面" width={1800} height={1125} sizes="(max-width: 900px) 100vw, 420px" /><figcaption>方案详情 · 总览与平面</figcaption></figure>
            <figure><Image unoptimized src={`${MEDIA}/shots/10-project-details.webp`} alt="方案详情页：面积表与材质清单" width={1800} height={1188} sizes="(max-width: 900px) 100vw, 420px" /><figcaption>面积表 · 材质与软装清单</figcaption></figure>
            <figure><Image unoptimized src={`${MEDIA}/shots/13-viewer-gaming-night.webp`} alt="3D 方案：电竞房室内夜景" width={1800} height={1125} sizes="(max-width: 900px) 100vw, 420px" /><figcaption>3D 室内视角 · 电竞房夜景</figcaption></figure>
          </div>
        </section>

        <section className={s.tech}>
          <div className={s.techCopy}>
            <span>06 · PIPELINE</span>
            <h2>一份场景数据，<br />驱动出图与 3D。</h2>
            <div className={s.facts}>{facts.map(([value, label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div>
          </div>
          <ol className={s.pipeline}>
            {pipeline.map(([title, copy], index) => <li key={title}><span>0{index + 1}</span><b>{title}</b><p>{copy}</p></li>)}
          </ol>
        </section>

        <section className={s.closing}>
          <span>QIJU · AI INTERIOR DESIGN</span>
          <h2>先看见它，先走进它，<br />再决定它。</h2>
        </section>

        <div className={s.backLink}>
          <Link href="/projects">← 返回项目归档</Link>
          <span>交互原型 · 示例项目数据 · 材质 Poly Haven CC0</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
