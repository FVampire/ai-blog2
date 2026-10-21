import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import { FLOW_SHOTS } from './gallery-data';
import s from './moyun.module.css';
import { ClipStrip, FeatureGallery, FlowFilm, StudioEmbed } from './MoyunShowcase';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import { projectMedia } from '../media';

const BASE = '/projects/moling';
const MEDIA = projectMedia(BASE);
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAGE_TITLE = '墨韵 Moyun · 长篇 AI 创作工作台 - 五月的火';
const PAGE_DESCRIPTION = '为长篇小说而生的桌面创作系统：全书级上下文、多模型竞选、流式正文、审稿修订与故事记忆同步，让五十万字始终属于同一个世界。';
const PAGE_IMAGE = `${BASE}/cover.webp`;

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/projects/moling` },
  openGraph: {
    type: 'article', title: PAGE_TITLE, description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/projects/moling`, siteName: SITE_NAME, locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1600, height: 1000, alt: '墨韵 Moyun' }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESCRIPTION, images: [PAGE_IMAGE] },
};

const facts = [
  ['111', '章节'],
  ['51 万', '正文字数'],
  ['534', '伏笔档案'],
  ['2,737', 'Canon 事件'],
  ['1,053', '故事实体'],
  ['98', '次工作流运行'],
];

const pillars = [
  ['全书级上下文', '每一章动笔前，从五十万字里检索真正相关的人物、伏笔与前情，在 token 预算内装配成本章上下文。'],
  ['多模型竞选', '同一份上下文交给多个模型并行起笔，按连贯性、人物一致性、伏笔呼应与文风评审，择优续写。'],
  ['故事记忆', '定稿后抽取人物位置、关系与物品变化，逐条确认写回 Canon，世界始终停在正确的此刻。'],
  ['伏笔生命周期', '埋设、推进、回收三栏追踪 534 条伏笔，回收率与悬置时间一目了然。'],
];



export default function MoyunPage() {
  return (
    <div className={s.shell}>
      <Header />
      <main className={s.page}>
        <section className={s.hero}>
          <div className={s.topline}>
            <div><Link href="/">首页</Link><i>/</i><Link href="/projects">项目</Link><i>/</i><span>墨韵</span></div>
            <span>LONGFORM AI STUDIO · 2026</span>
          </div>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>AI NOVEL WORKBENCH · DESKTOP PRODUCT</p>
            <h1><span>墨韵</span><i>Moyun</i></h1>
            <h2>让一部长篇，<br />始终记得自己。</h2>
            <p>为长篇小说而生的 AI 创作工作台。写出一段文字并不难，难的是让五十万字始终属于同一个世界。</p>
          </div>
          <FlowFilm />
          <dl className={s.facts}>
            {facts.map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>

        <section className={s.pillars}>
          <div className={s.heading}>
            <span>01 · WHY MOYUN</span>
            <h2>故事不是一次生成的输入，<br />而是一套持续演进的状态。</h2>
          </div>
          <div className={s.pillarGrid}>
            {pillars.map(([title, copy], i) => <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </section>

        <section className={s.flow}>
          <div className={s.heading}>
            <span>02 · ONE CHAPTER, SIX STEPS</span>
            <h2>从章节目标，到世界记住这一章。</h2>
            <p>以第 112 章《此桶概不赊账》为例：上下文装配、章节规划、多模型竞选、正文、审稿修订、记忆同步，一气呵成。</p>
          </div>
          <ClipStrip />
          <div className={s.compete}>
            <div className={s.competeCopy}>
              <h3>让好开头，自己胜出。</h3>
              <p>同一份上下文交给三个模型。它们首字时间、速度和写出的长度都不同；先写完的等待其他候选，全部完成后才进入评审。</p>
            </div>
            <ol className={s.competeSteps}>
              {([
                ['stream', '各自起笔', '首字 0.6s / 1.4s / 2.3s，速度约 38 / 24 / 31 字每秒，长度 307 / 322 / 334 字。'],
                ['wait', '等待全部完成', '先完成的候选进入等待，其余继续写到自然收尾。'],
                ['review', '逐项评审', '连贯性、人物一致性、伏笔呼应、文风四项打分，评语引用原文。'],
                ['winner', '胜出并接续', '照夜以 97.3 胜出；落选稿可展开全文，留作素材。'],
              ] as const).map(([key, title, copy], i) => {
                const shot = FLOW_SHOTS[key];
                return (
                  <li key={key}>
                    <div><span>0{i + 1}</span><b>{title}</b><p>{copy}</p></div>
                    <figure><Image unoptimized src={`${MEDIA}/shots-r6/${shot.shot}.webp`} alt={`多模型竞选：${title}`} width={shot.w} height={shot.h} sizes="(max-width: 900px) 100vw, 860px" /></figure>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>


        <section className={s.gallery}>
          <div className={s.heading}>
            <span>03 · THE STUDIO</span>
            <h2>一整套长篇写作的工作台。</h2>
            <p>按功能分组浏览；每张图都可以点开看高清原图。</p>
          </div>
          <FeatureGallery />
        </section>

        <section className={s.delivery}>
          <div className={s.heading}>
            <span>04 · TRY IT</span>
            <h2>亲手写下第 112 章。</h2>
            <p>下面就是工作台本身：可以播放、暂停、倍速，也可以跳到任意一步，看上下文、竞选与记忆同步如何衔接。</p>
          </div>
          <StudioEmbed />
        </section>

        <section className={s.closing}>
          <span>MOYUN · LONGFORM AI STUDIO</span>
          <p>从第一句话，到最后一个伏笔回响。</p>
          <h2>墨韵陪伴的不是一次生成，<br />而是一整个故事成为它自己的过程。</h2>
        </section>

        <div className={s.backLink}>
          <Link href="/projects">← 返回项目归档</Link>
          <span>交互原型 · 示例数据 · 统计数字来自作者真实写作项目</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
