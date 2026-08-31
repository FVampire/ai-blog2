import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import CoreLoopExplorer from '../CoreLoopExplorer';
import MusicPlayer from '../MusicPlayer';
import { TideAnchors } from '../TideFrame';
import VisionShowcase from '../VisionShowcase';
import {
  BASE_PATH,
  PAGE_IMAGE,
  SITE_NAME,
  SITE_URL,
  factions,
  gallery,
  playAnchors,
} from '../data';
import styles from '../forgetting-tide.module.css';

const PAGE_TITLE = '玩法 · 遗忘潮汐';
const PAGE_DESCRIPTION = '远征、战斗、见证、映照与营地恢复。查看《遗忘潮汐》的核心循环、系统界面、开发过程与原创配乐。';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${BASE_PATH}/play` },
  openGraph: {
    type: 'article',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}${BASE_PATH}/play`,
    siteName: SITE_NAME,
    locale: 'zh_CN',
    images: [{ url: PAGE_IMAGE, width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESCRIPTION, images: [PAGE_IMAGE] },
};

export default function PlayPage() {
  return (
    <main className={styles.page}>
      <TideAnchors items={playAnchors} />

      <section className={styles.pageHero}>
        <Image src="/projects/forgetting-tide/vision/camp-final.png" alt="最终营地枢纽" fill sizes="100vw" priority />
        <div className={styles.pageHeroShade} />
        <div className={styles.pageHeroCopy}>
          <span>04 / PLAY</span>
          <h1>核心玩法</h1>
          <p>刚才那一章，是怎么被拆成玩家能做的六步。</p>
        </div>
      </section>

      <section className={styles.loopSection} id="loop">
        <div className={styles.sectionHeading}>
          <div><span>06</span><p>CORE LOOP</p></div>
          <h2>刚才那一章，<br />是怎么被拆成六步的。</h2>
          <p>灰烬医院的证词、路线与最终映照，被拆进一局的六个连续决策；每一步都把结果交给下一步。</p>
        </div>
        <CoreLoopExplorer />
      </section>

      <section className={styles.atlasSection} id="systems">
        <div className={styles.sectionHeading}>
          <div><span>07</span><p>SYSTEM DESIGN</p></div>
          <h2>战斗、技能与生物生态</h2>
          <p>三个系统使用同一组属性、资源与身份数据，因此每次成长都会同时改变战斗和叙事表达。</p>
        </div>
        <div className={styles.atlasList}>
          <details open>
            <summary>
              <span>01</span>
              <div><b>五种属性，五种资源用法</b><small>克制提供效率，资源决定行动方式</small></div>
              <i>＋</i>
            </summary>
            <div className={styles.atlasContent}>
              <div className={styles.factionCycle}>微光 <i>→</i> 幽影 <i>→</i> 回声 <i>→</i> 锈铁 <i>→</i> 生息 <i>→</i> 微光</div>
              <div className={styles.factionGrid}>
                {factions.map(([name, verb, copy], index) => (
                  <article key={name} data-tone={index}>
                    <span>0{index + 1}</span>
                    <h3>{name}</h3>
                    <b>{verb}</b>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </details>
          <details>
            <summary>
              <span>02</span>
              <div><b>共享技能池与构筑资格</b><small>属性、种族和战术倾向共同决定可装配技能</small></div>
              <i>＋</i>
            </summary>
            <div className={styles.atlasContent}>
              <div className={styles.systemNumbers}>
                <div><strong>20—30</strong><span>通用主动</span></div>
                <div><strong>60—80</strong><span>阵营主动</span></div>
                <div><strong>80—100</strong><span>种族主动</span></div>
                <div><strong>40+</strong><span>标志技能</span></div>
                <div><strong>400</strong><span>天赋内容池</span></div>
              </div>
              <p className={styles.atlasNote}>同一项“荆棘外衣”，微光强化会长出荆棘，生息强化增加护盾，锈铁强化保留反击层数，幽影强化则施加中毒。技能名称不变，队伍语法会改变它的用途。</p>
            </div>
          </details>
          <details>
            <summary>
              <span>03</span>
              <div><b>观察、召回与同行成长</b><small>生物通过世界关系加入，而不是从抽卡池里出现</small></div>
              <i>＋</i>
            </summary>
            <div className={styles.atlasContent}>
              <div className={styles.ecologyPaths}>
                <article><span>ENTITY RECALL</span><h3>实体召回</h3><p>观察明确个体，收集仍指向它的碎片，再由灯塔稳定核心。主线生物拥有确定性路径。</p></article>
                <article><span>ECOLOGICAL VISIT</span><h3>生态来访</h3><p>先恢复道路与栖息关系，再发出不包含服从命令的信标。随机只决定谁先回应。</p></article>
                <article><span>COMPANION MEMORY</span><h3>同行成长</h3><p>三阶段轮廓保留稳定核心，最终形态由同行记忆与两条自我解释分支决定。</p></article>
              </div>
            </div>
          </details>
        </div>
      </section>

      <section className={styles.visionSection} id="product">
        <div className={styles.sectionHeading}>
          <div><span>08</span><p>FINAL PRODUCT UI</p></div>
          <h2>最终产品系统界面</h2>
          <p>图鉴、技能池与见证墙共用一套暗潮材质、信息层级和交互语法，复杂规则在同一屏内完成预览与决策。</p>
        </div>
        <VisionShowcase />
      </section>

      <section className={styles.processSection} id="process">
        <div className={styles.sectionHeading}>
          <div><span>09</span><p>DEVELOPMENT PROCESS</p></div>
          <h2>一座营地，<br />从功能骨架到最终画面</h2>
          <p>同一个空间经过三轮处理：先验证移动与功能分区，再建立材质、角色和光照，最后把系统入口收进完整的环境叙事与界面层级。</p>
        </div>
        <div className={styles.processRail}>
          <article>
            <div><Image src="/projects/forgetting-tide/screenshots/camp.png" alt="营地的三维灰盒骨架" fill sizes="(max-width: 800px) 100vw, 33vw" /></div>
            <span>01 / STRUCTURE</span>
            <h3>3D 功能骨架</h3>
            <p>确认灯塔、档案台、工坊、潮门、篝火与镜头移动的空间关系。</p>
          </article>
          <article>
            <div><Image src="/projects/forgetting-tide/vision/camp-art-pass.png" alt="营地披上美术素材后的中央庭院" fill sizes="(max-width: 800px) 100vw, 33vw" /></div>
            <span>02 / ART PASS</span>
            <h3>材质与场景整合</h3>
            <p>统一湿石、黄铜、灯光与角色比例，让功能点首先作为地点成立。</p>
          </article>
          <article className={styles.finalProcess}>
            <div><Image src="/projects/forgetting-tide/vision/camp-final.png" alt="遗忘潮汐最终产品营地界面" fill sizes="(max-width: 800px) 100vw, 44vw" /></div>
            <span>03 / FINAL PRODUCT</span>
            <h3>最终营地枢纽</h3>
            <p>资源、编队状态与远征入口被压到边缘；画面主体留给灯塔、同行生物和可恢复的社区。</p>
          </article>
        </div>
        <details className={styles.galleryDisclosure}>
          <summary>
            <div><span>ASSET LIBRARY</span><b>展开查看游戏画面、Boss 与世界资产</b></div>
            <i>＋</i>
          </summary>
          <div className={styles.galleryGrid}>
            {gallery.map((item) => (
              <figure key={item.src}>
                <div><Image src={item.src} alt={item.label} fill sizes="(max-width: 700px) 100vw, 50vw" /></div>
                <figcaption><span>{item.label}</span><i>{item.kind}</i></figcaption>
              </figure>
            ))}
          </div>
        </details>
      </section>

      <section className={styles.musicSection} id="soundtrack">
        <details className={styles.musicDisclosure} open>
          <summary>
            <div>
              <span>10 / ORIGINAL SOUNDTRACK</span>
              <h2>12 首场景循环配乐</h2>
              <p>完整配乐覆盖营地、探索、战斗与映照；此处试听四首代表主题</p>
            </div>
            <i>＋</i>
          </summary>
          <MusicPlayer />
        </details>
      </section>

      <section className={styles.outcomeSection}>
        <div>
          <div className={styles.sectionMark}>12 / COMPLETE PACKAGE</div>
          <h2>从世界规则，<br />做到玩家看得见的结果。</h2>
        </div>
        <div className={styles.outcomes}>
          <article><span>DESIGN</span><p>商业企划、世界设定、章节事件、战斗规则与内容规模形成同一套产品定义。</p></article>
          <article><span>PRODUCT</span><p>远征、战斗、见证、映照、营地恢复与生物成长组成完整的长期循环。</p></article>
          <article><span>PRESENTATION</span><p>最终界面、场景美术、Boss 概念与原创声音共同建立可辨认的产品气质。</p></article>
        </div>
        <div className={styles.closingQuote}>
          <p>《遗忘潮汐》的设计命题</p>
          <strong>人们仍有能力共同决定，接下来要记住什么。</strong>
        </div>
        <div className={styles.backLink}>
          <Link href={BASE_PATH}>← 返回宇宙门户</Link>
          <Link href="/projects">项目归档</Link>
        </div>
      </section>
    </main>
  );
}
