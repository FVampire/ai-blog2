import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import { ClipStrip, FlowFilm, StudioEmbed } from './MoyunShowcase';
import s from './moyun.module.css';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';

const BASE = '/projects/moling';
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAGE_TITLE = '墨韵 Moyun · 长篇 AI 创作工作台 - 五月的火';
const PAGE_DESCRIPTION = '为长篇小说而生的桌面创作系统：全书级上下文、多模型竞选、流式正文、审稿修订与故事记忆同步，让五十万字始终属于同一个世界。';
const PAGE_IMAGE = `${BASE}/shots/11-competition.webp`;

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/projects/moling` },
  openGraph: {
    type: 'article', title: PAGE_TITLE, description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/projects/moling`, siteName: SITE_NAME, locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1800, height: 1125, alt: '墨韵多模型竞选' }],
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

const gallery = [
  ['01-library', '书斋', '作品、今日落笔与写作热力。'],
  ['03-outline', '大纲工作台', '总纲、分卷、故事弧与章节卡片共用一条时间线。'],
  ['05-relations', '人物关系', '以主角为中心展开的命运之网。'],
  ['06-foreshadow', '伏笔看板', '埋设 → 推进 → 回收，回收率环形统计。'],
  ['07-canon', 'Canon 状态中心', '实体当前状态与变更时间线。'],
  ['08-tasks', '任务中心', '工作流运行记录与多模型调用统计。'],
] as const;

const portraits = [
  ['liwen', '李稳', '主角 · 青竹宗弟子'],
  ['xiaolie', '萧烈', '剑修 · 外门执事'],
  ['suhongxiu', '苏红袖', '剑修 · 冷静敏锐'],
  ['linmiaomiao', '林妙妙', '丹修 · 灵动直率'],
  ['xuanjizi', '玄机子', '长老 · 深藏不露'],
  ['zhoupu', '周朴', '同门 · 忠厚可靠'],
] as const;

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
            <p>以第 112 章《此桶概不赊账》为例：上下文装配、细纲、多模型竞选、正文、审稿修订、记忆同步，一气呵成。</p>
          </div>
          <ClipStrip />
          <div className={s.compete}>
            <figure>
              <Image src={`${BASE}/shots/11-competition.webp`} alt="三个模型并行起笔并接受评审" width={1800} height={1125} sizes="(max-width: 900px) 100vw, 1240px" />
            </figure>
            <div>
              <h3>让好开头，自己胜出。</h3>
              <p>三个模型基于同一份上下文各写一个开头。评审从连贯性、人物一致性、伏笔呼应、文风四个维度打分，并给出理由；胜出稿接续完成整章，落选稿留作素材。</p>
              <p className={s.score}><b>97.3</b><span>本轮胜出 · 照夜</span></p>
            </div>
          </div>
          <div className={s.pair}>
            <figure><Image src={`${BASE}/shots/13-review.webp`} alt="审稿意见" width={1800} height={1125} sizes="(max-width: 900px) 100vw, 620px" /><figcaption>审稿：一致性检查给出修改意见</figcaption></figure>
            <figure><Image src={`${BASE}/shots/15-memory.webp`} alt="记忆同步" width={1800} height={1125} sizes="(max-width: 900px) 100vw, 620px" /><figcaption>记忆同步：状态提案逐条确认</figcaption></figure>
          </div>
        </section>

        <section className={s.cast}>
          <div className={s.heading}>
            <span>03 · CHARACTERS</span>
            <h2>纸上众生，各有来处。</h2>
            <p>角色卡记录设定、出场与当前状态；生成时自动引用，保证称谓、关系与性格前后一致。</p>
          </div>
          <div className={s.portraits}>
            {portraits.map(([id, name, role]) => (
              <figure key={id}>
                <Image src={`${BASE}/app/art/${id}.webp`} alt={`${name}立绘`} width={640} height={960} sizes="(max-width: 900px) 33vw, 200px" />
                <figcaption><b>{name}</b><span>{role}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={s.gallery}>
          <div className={s.heading}>
            <span>04 · THE STUDIO</span>
            <h2>一整套长篇写作的工作台。</h2>
          </div>
          <div className={s.galleryGrid}>
            {gallery.map(([id, title, copy]) => (
              <figure key={id}>
                <Image src={`${BASE}/shots/${id}.webp`} alt={`墨韵 · ${title}`} width={1800} height={1125} sizes="(max-width: 900px) 100vw, 620px" />
                <figcaption><b>{title}</b>{copy}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={s.delivery}>
          <div className={s.heading}>
            <span>05 · TRY IT</span>
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
