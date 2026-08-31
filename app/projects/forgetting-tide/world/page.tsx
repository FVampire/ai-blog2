import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import { TideAnchors } from '../TideFrame';
import WorldAtlas from '../WorldAtlas';
import { BASE_PATH, PAGE_IMAGE, SITE_NAME, SITE_URL, memoryLayers, worldAnchors, worldRegions } from '../data';
import styles from '../forgetting-tide.module.css';

const PAGE_TITLE = '世界 · 遗忘潮汐';
const PAGE_DESCRIPTION = '维拉汀不缺记录，它缺的是记录之间还连着的那根线。认识遗忘潮汐、五座主遗迹，以及“仍被记得”如何成为能源。';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${BASE_PATH}/world` },
  openGraph: {
    type: 'article',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}${BASE_PATH}/world`,
    siteName: SITE_NAME,
    locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESCRIPTION, images: [PAGE_IMAGE] },
};

export default function WorldPage() {
  return (
    <main className={styles.page}>
      <TideAnchors items={worldAnchors} />

      <section className={styles.pageHero}>
        <Image src="/projects/forgetting-tide/concepts/world-atlas.png" alt="维拉汀世界地图" fill sizes="100vw" priority />
        <div className={styles.pageHeroShade} />
        <div className={styles.pageHeroCopy}>
          <span>01 / WORLD</span>
          <h1>维拉汀</h1>
          <p>潮汐不带走东西，它带走东西之间的关系。</p>
        </div>
      </section>

      <section className={styles.worldChapter} id="atlas">
        <div className={styles.sectionHeading}>
          <div><span>01</span><p>ATLAS</p></div>
          <h2>先认识这座半岛，<br />以及它为什么把“仍被记得”当作能源。</h2>
          <p>从断名海到潮灯之家，地图上能被标出的地点，都是还没被完全冲散的关系。</p>
        </div>
        <WorldAtlas />
      </section>

      <section className={styles.worldChapter} id="tide">
        <div className={styles.worldColumns}>
          <div className={styles.worldCopy}>
            <p>维拉汀不缺记录。它缺的是记录之间还连着的那根线。每隔一段时间，遗忘潮汐从断名海涌上来，漫过城邦、病院与档案馆。潮水退去后，纸还在，字还在，只是没有人能说清这一页属于谁、又为什么被写下。</p>
            <p>于是维拉汀人学会了一件事：与其抢救记录，不如抢救关系。潮灯之家是最后一座还在运转的灯塔，它不靠燃料，靠“仍被记得”发光。你，一名姓名已被整齐切除的寻潮者，带着三只由残响长成的生物，走回那些还没被完全冲散的地方。</p>
            <p>潮水有自己的次序。姓名、日期、编号最先离开，且不留痕迹。事件和因果需要有人复述，才留得下。手势、气味、走惯的路——潮汐碰不到，身体先记得。被带走的部分不会消失，它们脱离主人，长成会动的形状。</p>
          </div>
          <div className={styles.memoryLayers}>
            {memoryLayers.map(([label, copy]) => (
              <div key={label}><b>{label}</b><span>{copy}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.regionShowcase} id="regions">
        <div className={styles.sectionHeading}>
          <div><span>02</span><p>REGIONS</p></div>
          <h2>五座主遗迹，<br />五种还在发光的属性。</h2>
          <p>系统层的克制环在世界层有出处。灰烬医院位于幽影裂谷与断名海之间的滩地。</p>
        </div>
        <div className={styles.regionBanners}>
          {worldRegions.map((region) => (
            <article key={region.id} className={styles.regionBanner}>
              <div className={styles.regionBannerArt}>
                <Image src={region.image} alt={region.imageAlt} fill sizes="(max-width: 900px) 100vw, 42vw" />
              </div>
              <div className={styles.regionBannerCopy}>
                <span>{region.attribute}</span>
                <h3>{region.name}</h3>
                <p>{region.blurb}</p>
                <p>{region.copy}</p>
              </div>
            </article>
          ))}
        </div>
        <p className={styles.regionNote}>灰烬医院位于幽影裂谷与断名海之间的滩地——这里的事物，只有被观察时才有形状。</p>
      </section>

      <section className={styles.worldChapter} id="law">
        <p className={styles.worldRule}>潮汐不销毁事物，只销毁事物之间的联系。所以在维拉汀，遗忘不是空白，是错位。</p>
        <div className={styles.inlineCta}>
          <Link href={`${BASE_PATH}/story`}>阅读灰烬医院的故事</Link>
          <Link href={`${BASE_PATH}/npcs`}>认识住在这里的人</Link>
        </div>
      </section>
    </main>
  );
}
