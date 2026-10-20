import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import s from './wardrobe.module.css';
import { LookViewerEmbed, QualityCompare } from './WardrobeShowcase';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';

const BASE = '/projects/wardrobe-lab';
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAGE_TITLE = 'Wardrobe Studio · 万千造型，始终是你 - 五月的火';
const PAGE_DESCRIPTION = '一个 AI 换装产品：从一张人物照片出发，选择服装、生成造型，并在前后对比中确认“还是你”。';
const PAGE_IMAGE = `${BASE}/shots/01-home-hero.webp`;

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/projects/wardrobe-lab` },
  openGraph: {
    type: 'article', title: PAGE_TITLE, description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/projects/wardrobe-lab`, siteName: SITE_NAME, locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1800, height: 921, alt: 'Wardrobe Studio 产品首页' }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESCRIPTION, images: [PAGE_IMAGE] },
};

const problems = [
  ['不像本人', '换上新衣服，脸、发型和体型也跟着变了，结果只是“一个穿着它的陌生人”。'],
  ['不贴身', '服装像贴纸一样浮在身上，忽略姿态、遮挡与褶皱。'],
  ['难比较', '一次只看一张图，很难判断哪套真正适合自己。'],
];

const steps = [
  { no: '01', title: '上传人物', shot: '02-step-person', size: [1800, 1138], copy: '载入人物照片后依次完成抠图与身体解析，侧栏给出全身、正面、光照等检测结果，作为换装的基准。', points: ['精细抠图', '身体区域解析', '质量检测'] },
  { no: '02', title: '选择服装', shot: '03-step-wardrobe', size: [1800, 1421], copy: '衣橱以单品图陈列，带风格标签；可以多选，一次生成整组造型。', points: ['单品衣橱', '风格标签', '批量选择'] },
  { no: '03', title: '生成造型', shot: '04-step-generating', size: [1800, 1137], copy: '人物解析、姿态匹配、服装生成、光影融合、输出五个阶段依次推进，画布展示每一步的中间结果。', points: ['五阶段进度', '中间结果可见', '随时跳过'] },
  { no: '04', title: '查看结果', shot: '05-step-result', size: [1800, 2220], copy: '原图与造型在同一画框中逐像素对齐，拖动分割线即可比较；面部特写单独对照，确认身份没有改变。', points: ['对齐对比', '场景切换', '身份对照'] },
];

const looks = ['00-source', '01-coat', '02-suit', '03-jacket', '04-street', '05-western', '06-armor', '07-evening'];
const lookNames = ['原图', '驼色大衣', '黑色西装', '银灰夹克', '城市街头', '西部麂皮', '未来盔甲', '深夜礼服'];

export default function WardrobeLabPage() {
  return (
    <div className={s.shell}>
      <Header />
      <main className={s.page}>
        <section className={s.hero}>
          <div className={s.topline}>
            <div><Link href="/">首页</Link><i>/</i><Link href="/projects">项目</Link><i>/</i><span>Wardrobe Studio</span></div>
            <span>AI FASHION · 2026</span>
          </div>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>AI VIRTUAL TRY-ON · PRODUCT CASE</p>
            <h1>Wardrobe <i>Studio</i></h1>
            <h2>万千造型，<br />始终是<em>你</em>。</h2>
            <p>一个 AI 换装产品。核心不是“换得多”，而是换完之后，镜子里的人依然是你：同样的面孔、发型、体型与姿态。</p>
          </div>
          <figure className={s.heroShot}>
            <div className={s.browserBar} aria-hidden="true"><i /><i /><i /><span>Wardrobe Studio</span></div>
            <Image src={PAGE_IMAGE} alt="Wardrobe Studio 首页：万千造型，始终是你" width={1800} height={921} priority sizes="(max-width: 900px) 100vw, 1240px" />
          </figure>
          <dl className={s.heroMeta}>
            <div><dt>角色</dt><dd>产品设计 / 交互 / 视觉 / 前端</dd></div>
            <div><dt>形态</dt><dd>Web 产品原型 + 造型查看器</dd></div>
            <div><dt>样例</dt><dd>1 位人物 · 7 套造型 · 4 种场景</dd></div>
            <div><dt>技术</dt><dd>图像生成与编辑 · Vite · TypeScript</dd></div>
          </dl>
        </section>

        <section className={s.problem}>
          <span className={s.label}>01 · WHY</span>
          <h2>换装最难的部分，<br />是让人还是那个人。</h2>
          <div className={s.problemGrid}>
            {problems.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </section>

        <section className={s.identity}>
          <div className={s.heading}>
            <span className={s.label}>02 · IDENTITY</span>
            <h2>同一个人，七种造型。</h2>
            <p>八张全身图共享同一张脸、同一姿态与同一影棚光。下方是从每张造型中裁出的面部，可以直接对照。</p>
          </div>
          <div className={s.lookStrip}>
            {looks.map((id, i) => (
              <figure key={id}>
                <Image src={`${BASE}/assets/looks/${id}.webp`} alt={`造型：${lookNames[i]}`} width={1024} height={1365} sizes="(max-width: 900px) 25vw, 160px" />
                <Image className={s.face} src={`${BASE}/media/faces/${id}.webp`} alt={`${lookNames[i]}面部特写`} width={300} height={300} sizes="(max-width: 900px) 25vw, 160px" />
                <figcaption>{lookNames[i]}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={s.flow}>
          <div className={s.heading}>
            <span className={s.label}>03 · PRODUCT FLOW</span>
            <h2>四步，从一张照片到一整个衣橱。</h2>
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
                <Image src={`${BASE}/shots/${step.shot}.webp`} alt={`换装工作台 · ${step.title}`} width={step.size[0]} height={step.size[1]} sizes="(max-width: 900px) 100vw, 820px" />
              </figure>
            </article>
          ))}
        </section>

        <section className={s.wardrobe}>
          <div className={s.heading}>
            <span className={s.label}>04 · WARDROBE & SCENES</span>
            <h2>从单品，到成片。</h2>
            <p>衣橱里的每件单品对应一套造型；成片可以放回影棚，也可以放进客厅或街头。</p>
          </div>
          <div className={s.items}>
            {looks.slice(1).map((id, i) => (
              <figure key={id}>
                <Image src={`${BASE}/media/items/${id}.webp`} alt={`单品：${lookNames[i + 1]}`} width={700} height={700} sizes="(max-width: 900px) 33vw, 170px" />
                <figcaption>{lookNames[i + 1]}</figcaption>
              </figure>
            ))}
          </div>
          <div className={s.scenes}>
            {[['studio', '暖调影棚'], ['living', '客厅'], ['street', '街头']].map(([id, name]) => (
              <figure key={id}>
                <Image src={`${BASE}/media/scenes/${id}.webp`} alt={`驼色大衣 · ${name}`} width={1024} height={1365} sizes="(max-width: 900px) 33vw, 420px" />
                <figcaption>驼色大衣 · {name}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={s.qualitySection}>
          <div className={s.heading}>
            <span className={s.label}>05 · QUALITY</span>
            <h2>照片不完美，也能开始。</h2>
            <p>低光、低对比和低分辨率的照片会先经过修复，再进入换装流程。</p>
          </div>
          <QualityCompare />
        </section>

        <section className={s.delivery}>
          <div className={s.heading}>
            <span className={s.label}>06 · DELIVERABLE</span>
            <h2>交付的，是一个可以亲手比较的造型册。</h2>
            <p>造型查看器把七套造型与原图放在同一个对齐画框里，拖动、切换、比较。</p>
          </div>
          <LookViewerEmbed />
        </section>

        <section className={s.closing}>
          <span>WARDROBE STUDIO</span>
          <h2>衣服改变，<br />个性不变。</h2>
        </section>

        <div className={s.backLink}>
          <Link href="/projects">← 返回项目归档</Link>
          <span>交互原型 · 示例数据 · 人物与服装图像由 AI 生成</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
