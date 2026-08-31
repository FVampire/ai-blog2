import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import CompanionGrowth from '../CompanionGrowth';
import NpcRoster from '../NpcRoster';
import { TideAnchors } from '../TideFrame';
import { BASE_PATH, PAGE_IMAGE, SITE_NAME, SITE_URL, npcAnchors } from '../data';
import styles from '../forgetting-tide.module.css';

const PAGE_TITLE = '人物 · 遗忘潮汐';
const PAGE_DESCRIPTION = '潮灯之家、灰烬医院与残响生物的人物名册。姓名被切除以后，立场、物证与代价仍能互相指认。';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${BASE_PATH}/npcs` },
  openGraph: {
    type: 'article',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}${BASE_PATH}/npcs`,
    siteName: SITE_NAME,
    locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESCRIPTION, images: [PAGE_IMAGE] },
};

export default function NpcsPage() {
  return (
    <main className={styles.page}>
      <TideAnchors items={npcAnchors} />

      <section className={styles.pageHero}>
        <Image src="/projects/forgetting-tide/hero.png" alt="寻潮者走向记忆灯塔" fill sizes="100vw" priority />
        <div className={styles.pageHeroShade} />
        <div className={styles.pageHeroCopy}>
          <span>03 / CHAMPIONS</span>
          <h1>人物名册</h1>
          <p>身份会被潮汐剥离，立场、物证与付过的代价却仍能互相指认。</p>
        </div>
      </section>

      <NpcRoster />

      <section className={styles.companionChapter} id="companions">
        <CompanionGrowth />
      </section>

      <section className={styles.antagonistSection} id="antagonist">
        <div className={styles.sectionHeading}>
          <div><span>03</span><p>ANTAGONIST</p></div>
          <h2>当制度写下恐惧，<br />纸页会替它继续执行。</h2>
          <p>灰烬医院的最终敌人不是某个恶人，而是一条被重复到获得形状的命令。</p>
        </div>
        <div className={styles.prototypeFeature}>
          <div className={styles.featureImage}>
            <Image src="/projects/forgetting-tide/concepts/paper-matron.png" alt="灰烬医院最终首领纸页母体" fill sizes="(max-width: 980px) 100vw, 72vw" />
            <span className={styles.mediaBadge}>FINAL BOSS · CHAPTER 01</span>
          </div>
          <div className={styles.featureCopy}>
            <span>ASHEN HOSPITAL</span>
            <h3>纸页母体</h3>
            <p>制度放大的恐惧不会停在人心里。灰烬医院把每一次“不要让他出去”都写进病历，纸页记住了那句话的形状，然后自己站了起来。</p>
            <p>她会重写敌人意图、封存玩家技能、召回被删掉的病历。玩家一路保留的证据，决定能削弱哪一个阶段。</p>
          </div>
        </div>
        <div className={`${styles.dualFeatures} ${styles.bossPhases}`}>
          <article><span>PHASE 01 · REWRITE</span><h3>重写意图</h3><p>调换敌方行动的指向，让已经读懂的战斗重新变得不可靠。</p></article>
          <article><span>PHASE 02 · SEAL</span><h3>封存技能</h3><p>把玩家依赖的行动写入封存目录，迫使队伍改用另一套资源语法。</p></article>
          <article><span>PHASE 03 · RECALL</span><h3>召回删页</h3><p>让被医院删除的病历重新入场；保留下来的物证决定哪些删页无法响应。</p></article>
        </div>
        <div className={styles.inlineCta}>
          <Link href={`${BASE_PATH}/story`}>回到灰烬医院的故事</Link>
          <Link href={`${BASE_PATH}/play`}>查看战斗与构筑</Link>
        </div>
      </section>
    </main>
  );
}
