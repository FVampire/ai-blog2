import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import { ClipStrip, FeatureGallery, FlowFilm, StudioEmbed } from './SeamShowcase';
import s from './seam.module.css';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';

const BASE = '/projects/ai-garment-pattern-agent';
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAGE_TITLE = 'SEAM · 让服装研发成为一套可计算的系统 - 五月的火';
const PAGE_DESCRIPTION = 'SEAM 服装研发 AI 工程系统：从一句描述到 StyleGraph、组合式制版、几何与缝长校验、改版、物料成本与工艺包，让每一次设计变化贯穿整套服装工程。';
const PAGE_IMAGE = `${BASE}/cover.webp`;

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/projects/ai-garment-pattern-agent` },
  openGraph: {
    type: 'article', title: PAGE_TITLE, description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/projects/ai-garment-pattern-agent`, siteName: SITE_NAME, locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1600, height: 1000, alt: 'SEAM 服装研发工程系统' }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESCRIPTION, images: [PAGE_IMAGE] },
};

const facts = [
  ['6', '类部件结构理解'],
  ['25', '衬衫裁片'],
  ['12 / 12', '缝长配对通过'],
  ['141', '刀口与工艺标记'],
  ['12', '缝制工序'],
  ['±0.75 mm', '袖窿配对公差'],
];

const pillars = [
  ['把款式理解成结构', '参考图、自然语言与尺寸表共同形成 StyleGraph：部件、层次、对称与装配关系都成为可继续操作的信息。'],
  ['组合出复杂版型', '以基础原型为起点，按依赖组合领、门襟、袖克夫、口袋与过肩，每一步都有工具、参数与原因。'],
  ['让精度有据可查', '曲线、裁片、缝长与刀口由确定性几何计算生成；每组缝线都有 A/B 长度、允许吃势与公差。'],
  ['一次修改传到全局', '用参数差异发起改版，自动定位受影响的裁片与 POM，未受影响的几何保持锁定。'],
];


export default function SeamPage() {
  return (
    <div className={s.shell}>
      <Header />
      <main className={s.page}>
        <section className={s.hero}>
          <div className={s.topline}>
            <div><Link href="/">首页</Link><i>/</i><Link href="/projects">项目</Link><i>/</i><span>SEAM</span></div>
            <span>AI GARMENT ENGINEERING · 2026</span>
          </div>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>PRODUCT DESIGN &amp; ENGINEERING</p>
            <h1>SEAM<span aria-hidden="true">✳</span></h1>
            <h2>让服装研发，<br />成为一套可计算的系统。</h2>
            <p>看懂款式，编排制版，校验几何，计算物料，生成工艺包。一次设计变化，贯穿整套服装工程。</p>
          </div>
          <FlowFilm />
          <dl className={s.facts}>
            {facts.map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>

        <section className={s.pillars}>
          <div className={s.heading}>
            <span>01 · WHY SEAM</span>
            <h2>一张好看的款式图，<br />离一件能做出来的衣服还很远。</h2>
          </div>
          <div className={s.pillarGrid}>
            {pillars.map(([title, copy], i) => <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </section>

        <section className={s.flow}>
          <div className={s.heading}>
            <span>02 · ONE SHIRT, END TO END</span>
            <h2>从一句描述，到一份工艺包。</h2>
            <p>以一件蓝色牛津衬衫为例：设计理解、组合式制版、几何与缝长校验、局部改版、工艺包，一条连续的工程上下文。</p>
          </div>
          <ClipStrip />
        </section>

        <section className={s.gallery}>
          <div className={s.heading}>
            <span>03 · THE STUDIO</span>
            <h2>一个工作台，贯穿研发全程。</h2>
            <p>点击图片可查看高清原图。</p>
          </div>
          <FeatureGallery />
        </section>

        <section className={s.delivery}>
          <div className={s.heading}>
            <span>04 · TRY IT</span>
            <h2>亲手走一遍研发流程。</h2>
            <p>下面就是工作台本身：可以运行完整流程，也可以逐页查看纸样、校验、改版与工艺包。</p>
          </div>
          <StudioEmbed />
        </section>

        <section className={s.closing}>
          <span>SEAM · AI GARMENT ENGINEERING</span>
          <h2>把设计意图，<br />变成制造语言。</h2>
        </section>

        <div className={s.backLink}>
          <Link href="/projects">← 返回项目归档</Link>
          <span>交互原型 · 示例项目数据</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
