import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import { BASE_PATH, PAGE_IMAGE, SITE_NAME, SITE_URL, npcs } from './data';
import { TideAnchors } from './TideFrame';
import styles from './forgetting-tide.module.css';

const PAGE_TITLE = '遗忘潮汐 · 维拉汀宇宙';
const PAGE_DESCRIPTION = '叙事构筑游戏《遗忘潮汐》的宇宙门户：世界、背景故事、人物与玩法。玩家决定哪一种现实会留下来。';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${BASE_PATH}` },
  openGraph: {
    type: 'article',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}${BASE_PATH}`,
    siteName: SITE_NAME,
    locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [PAGE_IMAGE],
  },
};

const portals = [
  {
    href: `${BASE_PATH}/world`,
    kicker: 'WORLD',
    title: '维拉汀',
    copy: '潮汐不带走东西，它带走东西之间的关系。',
    image: '/projects/forgetting-tide/concepts/world-atlas.png',
    alt: '维拉汀世界地图',
  },
  {
    href: `${BASE_PATH}/story`,
    kicker: 'LORE',
    title: '灰烬医院',
    copy: '三种证词都成立。你决定哪一种留下来。',
    image: '/projects/forgetting-tide/concepts/three-truths.png',
    alt: '灰烬医院三种现实',
  },
  {
    href: `${BASE_PATH}/npcs`,
    kicker: 'CHAMPIONS',
    title: '人物名册',
    copy: '姓名被切除以后，还剩什么可以认人。',
    image: '/projects/forgetting-tide/characters/tidewalker.png',
    alt: '寻潮者立绘',
  },
] as const;

const featured = npcs.filter((npc) => ['tidewalker', 'irie', 'seller', 'mia'].includes(npc.id));

export default function ForgettingTideHomePage() {
  return (
    <main className={styles.page}>
      <TideAnchors items={[['hero', '进入'], ['portals', '门户'], ['cast', '人物'], ['facts', '规模']]} />

      <section className={styles.hero} id="hero">
        <Image src="/projects/forgetting-tide/hero.png" alt="寻潮者与三只残响生物走向记忆灯塔" fill priority sizes="100vw" />
        <div className={styles.heroShade} />
        <div className={styles.heroTopline}>
          <div className={styles.breadcrumbs}>
            <Link href="/">首页</Link><i>/</i><Link href="/projects">项目</Link><i>/</i><span>遗忘潮汐</span>
          </div>
          <span>NARRATIVE ROGUELITE · 2026</span>
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>VILLATIN UNIVERSE</p>
          <h1>遗忘潮汐</h1>
          <div className={styles.englishTitle}>THE FORGETTING TIDE</div>
          <p className={styles.lead}>带领三只残响生物进入不断改写自身的遗迹。队伍决定你能取得什么证据，而你选择保留的证词，将成为下一次远征里的道路、敌人与居民。</p>
          <div className={styles.heroActions}>
            <Link href={`${BASE_PATH}/story`}>阅读故事</Link>
            <Link href={`${BASE_PATH}/npcs`}>认识人物</Link>
            <Link href={`${BASE_PATH}/play`}>进入玩法</Link>
          </div>
        </div>
        <div className={styles.heroMeta}>
          <div><span>PRODUCT</span><b>单机叙事构筑 Roguelite</b></div>
          <div><span>ROLE</span><b>主创 / 企划 / 系统 / 音乐</b></div>
          <div><span>PLATFORM</span><b>Windows PC · Godot 4</b></div>
          <div><span>DELIVERABLE</span><b>完整产品方案与可玩版本</b></div>
        </div>
      </section>

      <section className={styles.universeIntro} id="portals">
        <div className={styles.sectionMark}>00 / UNIVERSE</div>
        <h2>玩家不是判断谁说了真话，<br />而是决定哪一种现实会留下来。</h2>
        <p>《遗忘潮汐》把剧情选择放进核心循环：队伍构筑决定调查能力，远征路线决定能找到哪些旁证，章节结尾的映照再把选择写回地图、生态与战斗规则。</p>
        <div className={styles.portalGrid}>
          {portals.map((portal) => (
            <Link key={portal.href} href={portal.href} className={styles.portalCard}>
              <div>
                <Image src={portal.image} alt={portal.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
              <span>{portal.kicker}</span>
              <h3>{portal.title}</h3>
              <p>{portal.copy}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.featuredCast} id="cast">
        <div className={styles.sectionHeading}>
          <div><span>02</span><p>CHAMPIONS</p></div>
          <h2>姓名被切除以后，<br />还剩什么可以认人。</h2>
          <p>从潮灯之家的寻潮者，到灰烬医院三位互相冲突的见证者。</p>
        </div>
        <div className={styles.homeCastGrid}>
          {featured.map((npc) => (
            <Link key={npc.id} href={`${BASE_PATH}/npcs#${npc.id}`} className={styles.championTile}>
              <div className={styles.castPortrait}>
                {npc.src ? (
                  <Image src={npc.src} alt={`${npc.name}立绘`} fill sizes="(max-width: 700px) 50vw, 22vw" />
                ) : null}
                <span className={styles.portraitArchive}>ARCHIVE {npc.archive}</span>
              </div>
              <span>
                <b>{npc.name}</b>
                <i>{npc.nameEn}</i>
                <small>{npc.title}</small>
              </span>
            </Link>
          ))}
        </div>
        <div className={styles.inlineCta}>
          <Link href={`${BASE_PATH}/npcs`}>查看全部人物名册</Link>
        </div>
      </section>

      <section className={styles.homeFacts} id="facts">
        <div className={styles.factStrip}>
          <div><strong>80</strong><span>只可召回生物 · 三阶段成长</span></div>
          <div><strong>5</strong><span>种属性资源 · 全队行动语法</span></div>
          <div><strong>15</strong><span>种永久现实 · 五座主遗迹</span></div>
          <div><strong>12</strong><span>首原创配乐 · 全场景循环</span></div>
        </div>
        <div className={styles.closingQuote}>
          <p>《遗忘潮汐》的设计命题</p>
          <strong>人们仍有能力共同决定，接下来要记住什么。</strong>
        </div>
        <div className={styles.inlineCta}>
          <Link href={`${BASE_PATH}/play`}>查看系统设计与最终界面</Link>
        </div>
      </section>
    </main>
  );
}
