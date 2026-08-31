import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import { TideAnchors } from '../TideFrame';
import {
  BASE_PATH,
  PAGE_IMAGE,
  SITE_NAME,
  SITE_URL,
  loreChapters,
  realities,
  sealedChapters,
  storyAnchors,
  storyBeats,
} from '../data';
import styles from '../forgetting-tide.module.css';

const PAGE_TITLE = '故事 · 遗忘潮汐';
const PAGE_DESCRIPTION = '从断名海学会遗忘，到灰烬医院的三种证词。阅读《遗忘潮汐》的背景故事与首章事件。';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${BASE_PATH}/story` },
  openGraph: {
    type: 'article',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}${BASE_PATH}/story`,
    siteName: SITE_NAME,
    locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESCRIPTION, images: [PAGE_IMAGE] },
};

export default function StoryPage() {
  return (
    <main className={styles.page}>
      <TideAnchors items={storyAnchors} />

      <section className={styles.pageHero}>
        <Image src="/projects/forgetting-tide/concepts/three-truths.png" alt="灰烬医院三种现实映照" fill sizes="100vw" priority />
        <div className={styles.pageHeroShade} />
        <div className={styles.pageHeroCopy}>
          <span>02 / LORE</span>
          <h1>背景故事</h1>
          <p>维拉汀仍有能力共同决定，接下来要记住什么。</p>
        </div>
      </section>

      {loreChapters.map((chapter, index) => (
        <section key={chapter.id} className={styles.loreChapter} id={chapter.id}>
          <div className={`${styles.loreFrame} ${index % 2 === 1 ? styles.loreFrameFlip : ''}`}>
            <div className={styles.loreArt}>
              <Image src={chapter.image} alt={chapter.imageAlt} fill sizes="(max-width: 900px) 100vw, 56vw" />
              <span className={styles.mediaBadge}>{chapter.kicker}</span>
            </div>
            <div className={styles.loreCopy}>
              <span>{chapter.kicker}</span>
              <h2>{chapter.title}</h2>
              {chapter.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 18)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className={styles.storySection} id="case">
        <div className={styles.sectionHeading}>
          <div><span>05</span><p>STORY CASE</p></div>
          <h2>灰烬医院：<br />事件如何被写下</h2>
          <p>医院救过人，也囚禁过人。首章围绕这三件事逐层给出证据，并把选择交还给玩家。</p>
        </div>
        <div className={styles.storyBody}>
          <div className={styles.storyTimeline}>
            {storyBeats.map(([code, title, scene, consequence], index) => (
              <details key={code} open={index === 0}>
                <summary>
                  <span>{code}</span>
                  <div><b>{title}</b><small>{scene}</small></div>
                  <i>＋</i>
                </summary>
                <p><strong>这一段改变什么</strong>{consequence}</p>
              </details>
            ))}
          </div>
          <aside className={styles.storyAside}>
            <span>CHAPTER ROUTE</span>
            <h3>从失去姓名，到决定医院如何继续存在</h3>
            <ol>
              <li>学习倾听意图</li>
              <li>修复第一条道路</li>
              <li>召回第一只生物</li>
              <li>收集三组互斥证词</li>
              <li>用证据改写 Boss 阶段</li>
              <li>固定医院的主映照</li>
            </ol>
          </aside>
        </div>
        <div className={styles.realityCompare}>
          <div className={styles.compareHeading}>
            <span>PERMANENT REFLECTION</span>
            <h3>同一座医院，三套可继续游玩的现实</h3>
          </div>
          {realities.map(([name, gain, cost]) => (
            <article key={name}>
              <h4>{name}</h4>
              <p><b>获得</b>{gain}</p>
              <p><b>代价</b>{cost}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.nextTidesSection} id="next-tides">
        <div className={styles.sectionMark}>11 / NEXT TIDES</div>
        <div className={styles.nextTidesHeading}>
          <h2>灰烬医院只是第一次退潮。</h2>
          <p>以下章节的世界事实已经确定，画面还没做。列在这里，是因为它们决定了第一章为什么长成现在这样。</p>
        </div>
        <div className={`${styles.chapterGrid} ${styles.sealedGrid}`}>
          {sealedChapters.map(([code, title, fact, status]) => (
            <article key={code}>
              <span className={styles.sealedBadge}>SEALED</span>
              <i>{code}</i>
              <h3>{title}</h3>
              <p>{fact}</p>
              <small>{status}</small>
            </article>
          ))}
        </div>
        <div className={styles.inlineCta}>
          <Link href={`${BASE_PATH}/npcs`}>打开人物名册</Link>
          <Link href={`${BASE_PATH}/play`}>看选择如何变成玩法</Link>
        </div>
      </section>
    </main>
  );
}
