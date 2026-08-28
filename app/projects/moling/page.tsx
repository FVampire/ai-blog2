import Link from 'next/link';

import type { Metadata } from 'next';

import styles from './moling.module.css';
import PipelinePlayer from './PipelinePlayer';
import ProductWindow from './ProductWindow';
import ShowcaseSwitch from './ShowcaseSwitch';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';

const PAGE_TITLE = '墨灵 Moling · 长篇 AI 创作工作台 - 五月的火';
const PAGE_DESCRIPTION = '为长篇小说而生的桌面创作系统。墨灵持续维护角色、设定、伏笔与章节状态，让每一次生成都建立在完整故事上下文之上。';
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAGE_IMAGE = '/projects/moling/hero.png';

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/projects/moling` },
  openGraph: {
    type: 'article', title: PAGE_TITLE, description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/projects/moling`, siteName: SITE_NAME, locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1536, height: 1024, alt: '墨灵长篇 AI 创作工作台' }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESCRIPTION, images: [PAGE_IMAGE] },
};

const valueCards = [
  ['01', '全书级上下文', '从章节目标出发，自动选取真正相关的人物、事实、伏笔与前文章节。'],
  ['02', '情节持续规划', '总纲、分卷、故事弧与章节 Slot 互相连接，局部调整不惊动整本书。'],
  ['03', '角色与世界状态', '称谓、关系、位置和事件结果随定稿更新，世界始终处在正确的此刻。'],
  ['04', '审稿与局部修订', '一致性检查、多路候选与精准改写在同一章内完成，不破坏已经成立的部分。'],
];

const architecture = ['创作界面', '桌面运行时', '智能创作引擎', '本地故事数据库'];

export default function MolingPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero} id="hero">
          <div className={styles.heroAtmosphere} aria-hidden="true" />
          <div className={styles.heroTopline}>
            <div><Link href="/">首页</Link><i>/</i><Link href="/projects">项目</Link><i>/</i><span>墨灵 Moling</span></div>
            <span>LONGFORM AI STUDIO · 2026</span>
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>AI NOVEL WORKBENCH · DESKTOP PRODUCT</p>
            <h1><span>墨灵</span> <i>Moling</i></h1>
            <h2>让一部长篇，<br />始终记得自己。</h2>
            <p>为长篇小说而生的 AI 创作工作台。</p>
          </div>
          <div className={styles.heroWindow}>
            <ProductWindow
              src="/projects/moling/hero.png"
              alt="《南岸无灯》第七章《灯册》的墨灵工作台，章节导航、正文、故事上下文和 AI 协作面板同屏"
              label="墨灵 Moling · 南岸无灯 · 第七章《灯册》"
              priority
            />
          </div>
          <ul className={styles.heroTags} aria-label="产品能力">
            <li>长篇记忆</li><li>故事规划</li><li>智能审稿</li><li>本地创作</li>
          </ul>
        </section>

        <div className={styles.caseBody}>
          <section className={styles.valueSection} id="overview">
            <div className={styles.sectionIntro}>
              <span>01 · WHY MOLING</span>
              <h2>写出一段文字并不难。<br />难的是让数十万字始终属于同一个世界。</h2>
              <p>墨灵持续维护角色、关系、设定、伏笔、事件和章节状态，让每一次 AI 协作都建立在完整故事上下文之上。</p>
            </div>
            <div className={styles.valueGrid}>
              {valueCards.map(([index, title, copy]) => <article key={title}><span>{index}</span><h3>{title}</h3><p>{copy}</p></article>)}
            </div>
          </section>

          <section className={styles.studioSection} id="studio">
            <div className={styles.sectionHeading}>
              <div><span>02</span><p>CHAPTER STUDIO</p></div>
              <h2>一章之内，完成从目标到定稿的全部工作。</h2>
              <p>根据章节目标生成正文，引用人物、伏笔和前文事实；经过审稿、局部重写与多路竞态选择后，再把定稿同步回故事状态。</p>
            </div>
            <ProductWindow
              src="/projects/moling/showcase/chapter-studio.png"
              alt="《南岸无灯》第七章智能工作台展示四个场景 Slot、三路写作候选和右侧一致性提示"
              label="智能章节工作台 · 第七章《灯册》"
            />
            <div className={styles.studioNotes}>
              <article><b>完整上下文</b><p>章节目标、沈晚白、顾衡、阿苔、双重署名与城北档案库同时进入当前任务。</p></article>
              <article><b>多路竞态</b><p>文笔、结构与审慎三种任务角色并行给出候选，由作者决定写入哪一路。</p></article>
              <article><b>只改该改的</b><p>审稿意见定位到冲突句；局部修订保留段落其余部分的语气与节奏。</p></article>
            </div>
          </section>

          <section className={styles.systemSection} id="systems">
            <div className={styles.sectionHeading}>
              <div><span>03</span><p>LONGFORM SYSTEM</p></div>
              <h2>规划、人物与 Canon，<br />共享同一个故事现在时。</h2>
              <p>故事不是一次生成的输入，而是一套持续演进、相互校验的项目状态。</p>
            </div>
            <ShowcaseSwitch />
          </section>

          <section className={styles.pipelineSection} id="pipeline">
            <div className={styles.sectionHeading}>
              <div><span>04</span><p>CREATIVE PIPELINE</p></div>
              <h2>从章节目标，到世界记住这一章。</h2>
              <p>八步创作闭环使用《南岸无灯》的预设稿回放。候选、审稿和修订在几秒内完成演示，页面不请求模型。</p>
            </div>
            <PipelinePlayer />
          </section>

          <section className={styles.foundationSection} id="foundation">
            <div className={styles.foundationCopy}>
              <span>05 · LOCAL CREATIVE FOUNDATION</span>
              <h2>创作内容留在本地，<br />工具只负责让它更可靠。</h2>
              <p>桌面应用、本地项目与本地故事数据库组成稳定底座。自动保存、版本历史、恢复和完整导出，让长篇创作不依赖一次在线会话。</p>
              <ul><li>本地项目与 SQLite 故事数据库</li><li>多模型配置、任务分工与竞态选择</li><li>自动保存、版本历史与完整导出</li><li>写作内容始终由用户掌控</li></ul>
            </div>
            <div className={styles.architecture} aria-label="墨灵产品架构">
              {architecture.map((item, index) => <div key={item}><span>0{index + 1}</span><b>{item}</b>{index < architecture.length - 1 && <i aria-hidden="true">→</i>}</div>)}
              <div className={styles.techTags}><span>Tauri</span><span>Next.js</span><span>Rust</span><span>Python</span><span>SQLite</span></div>
            </div>
          </section>

          <section className={styles.closingSection} id="closing">
            <div className={styles.closingGlow} aria-hidden="true" />
            <span>MOLING · LONGFORM AI WORKBENCH</span>
            <p>从第一句话，<br />到最后一个伏笔回响。</p>
            <h2>墨灵陪伴的不是一次生成，<br />而是一整个故事成为它自己的过程。</h2>
            <div className={styles.closingBrand}><b>墨灵</b><i>Moling</i></div>
          </section>

          <div className={styles.backLink}><Link href="/projects">← 返回项目归档</Link><span>END OF CASE STUDY · 2026</span></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
