import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import MusicPlayer from './MusicPlayer';
import styles from './forgetting-tide.module.css';

export const metadata: Metadata = {
  title: '遗忘潮汐 · 项目成果 - 五月的火',
  description: '叙事驱动、队伍构筑型轻度 Roguelite《遗忘潮汐》的企划、世界设定、音乐与可玩原型展示。',
};

const loop = [
  ['01', '编队', '选择三只残响生物，决定队长与本次远征的构筑语法。'],
  ['02', '远征', '在持续保留的俯视地图上探索、追踪与规划撤退路线。'],
  ['03', '战斗', '用共享生命、护盾、行动力与记忆技能回应敌人意图。'],
  ['04', '见证', '收集同一地点彼此冲突的证词，区分事实、感受与责任。'],
  ['05', '映照', '选择由谁的版本塑造现实，并改变后续地图、敌人与奖励。'],
  ['06', '归航', '带回真相，恢复灯塔与世界；失败时也必须决定记住什么。'],
];

const gallery = [
  { src: '/projects/forgetting-tide/screenshots/camp.png', alt: '记忆灯塔 3D 营地实机界面', label: '01 · 记忆灯塔枢纽', kind: 'PROTOTYPE CAPTURE' },
  { src: '/projects/forgetting-tide/screenshots/expedition.png', alt: '灰烬医院远征地图实机界面', label: '02 · 持久远征地图', kind: 'PROTOTYPE CAPTURE' },
  { src: '/projects/forgetting-tide/screenshots/battle.png', alt: '回合制战斗实机界面', label: '03 · 残响战斗', kind: 'PROTOTYPE CAPTURE' },
  { src: '/projects/forgetting-tide/screenshots/creature-skills.png', alt: '残响生物技能构筑界面', label: '04 · 生物构筑', kind: 'PROTOTYPE CAPTURE' },
  { src: '/projects/forgetting-tide/concepts/paper-matron.png', alt: '灰烬医院首领纸页母体概念设计', label: '05 · 纸页母体', kind: 'BOSS CONCEPT' },
  { src: '/projects/forgetting-tide/concepts/world-atlas.png', alt: '维拉汀淹没世界地图', label: '06 · 维拉汀世界图', kind: 'WORLD BUILDING' },
];

export default function ForgettingTidePage() {
  return (
    <div>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <Image
            src="/projects/forgetting-tide/hero.png"
            alt="寻潮者带领三只残响生物走向记忆灯塔"
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroShade} />
          <div className={styles.heroTopline}>
            <Link href="/projects">← PROJECT ARCHIVE</Link>
            <span>PLAYABLE VERTICAL SLICE · 2026</span>
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>A NARRATIVE ROGUELITE ABOUT MEMORY &amp; WITNESS</p>
            <h1>遗忘潮汐</h1>
            <div className={styles.englishTitle}>THE FORGETTING TIDE</div>
            <p className={styles.lead}>
              世界会遗忘人，也会遗忘道路。带领三只残响生物进入不断改写自身的遗迹，收集证词，并决定由谁的真相塑造现实。
            </p>
          </div>
          <div className={styles.heroMeta}>
            <div><span>ENGINE</span><b>Godot 4</b></div>
            <div><span>GENRE</span><b>叙事探索 / 回合构筑</b></div>
            <div><span>PLATFORM</span><b>Windows PC</b></div>
            <div><span>STATUS</span><b>可玩原型</b></div>
          </div>
        </section>

        <div className={styles.caseBody}>
          <section className={styles.manifesto}>
            <div className={styles.sectionMark}>00 / PROJECT THESIS</div>
            <blockquote>“需要被恢复的，从来不只是一个正确的过去。”</blockquote>
            <div className={styles.manifestoText}>
              <p>
                《遗忘潮汐》是一款单机、叙事驱动、队伍构筑型轻度 Roguelite。它尝试把“叙事选择”从对白分支推进到系统层：玩家保存的证词会真正重组空间、遭遇和战斗规则。
              </p>
              <p>
                当前成果是一套可运行的灰盒垂直切片，同时覆盖游戏企划、世界规则、数据驱动内容、原创配乐、2D 概念美术与 3D 营地验证。
              </p>
            </div>
            <div className={styles.factStrip}>
              <div><strong>20</strong><span>只数据化残响生物</span></div>
              <div><strong>3</strong><span>种现实映照版本</span></div>
              <div><strong>4</strong><span>套场景循环配乐</span></div>
              <div><strong>15+</strong><span>类已验证系统</span></div>
            </div>
          </section>

          <section className={styles.loopSection}>
            <div className={styles.sectionHeading}>
              <div><span>01</span><p>GAME DESIGN</p></div>
              <h2>一次远征，<br />六次关于记忆的决定。</h2>
              <p>核心循环把编队、探索、证词选择与世界恢复连接为同一条因果链。</p>
            </div>
            <div className={styles.loopGrid}>
              {loop.map(([index, title, copy]) => (
                <article key={index}>
                  <span>{index}</span><h3>{title}</h3><p>{copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.worldSection}>
            <div className={styles.worldVisual}>
              <Image src="/projects/forgetting-tide/concepts/three-truths.png" alt="同一地点的三种冲突现实同时成立" fill sizes="(max-width: 900px) 100vw, 60vw" />
              <span>CONCEPT · THREE TRUTHS COEXIST</span>
            </div>
            <div className={styles.worldCopy}>
              <div className={styles.sectionMark}>02 / WORLD BUILDING</div>
              <h2>记忆不是录像，<br />真相也不是投票。</h2>
              <p>
                十二年前，储存全大陆共同记忆的“定潮计划”失控。青黑雾潮开始抹去称谓、面孔、道路，最终连建筑存在过的事实也会消失。
              </p>
              <div className={styles.memoryLayers}>
                <div><b>浮忆</b><span>易携带、会消散的即时经验</span></div>
                <div><b>实忆</b><span>被多方证据固定的事实锚点</span></div>
                <div><b>锚忆</b><span>足以长期维持现实的集体记忆</span></div>
              </div>
              <p className={styles.worldRule}>
                同一座医院，可以是护士眼中的救护病区、病人眼中的囚禁空间，也可以是孩子恐惧中的吞火兽巢穴。三种感受都真实存在，但它们承担的责任并不相同。
              </p>
            </div>
          </section>

          <section className={styles.prototypeSection}>
            <div className={styles.sectionHeading}>
              <div><span>03</span><p>PLAYABLE PROTOTYPE</p></div>
              <h2>让企划落到<br />每一次点击里。</h2>
              <p>原型以 Godot 4 和数据驱动内容搭建，已跑通营地、远征、战斗、映照与永久恢复。</p>
            </div>
            <div className={styles.prototypeFeature}>
              <div className={styles.featureImage}>
                <Image src="/projects/forgetting-tide/screenshots/camp.png" alt="记忆灯塔营地实机截图" fill sizes="(max-width: 900px) 100vw, 65vw" />
              </div>
              <div className={styles.featureCopy}>
                <span>HUB / MEMORY LIGHTHOUSE</span>
                <h3>一座会随着事实归航而复原的灯塔</h3>
                <p>编队、生物档案、现实工坊、恢复工程与出征入口都被安置在同一空间，局外成长直接改变这个“家”的可见状态。</p>
              </div>
            </div>
            <div className={styles.dualFeatures}>
              <article>
                <div className={styles.dualImage}><Image src="/projects/forgetting-tide/screenshots/expedition.png" alt="灰烬医院的俯视探索地图" fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
                <span>EXPEDITION MAP</span><h3>会记住脚步的地图</h3>
                <p>迷雾、点击寻路、驻守与游荡精英、事件、资源、锚点和撤离点共同形成风险路径。</p>
              </article>
              <article>
                <div className={styles.dualImage}><Image src="/projects/forgetting-tide/screenshots/battle.png" alt="残响生物回合制战斗" fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
                <span>TURN-BASED COMBAT</span><h3>生物就是记忆构筑</h3>
                <p>共享生命、护盾、行动力、敌人意图与队长规则，让三只残响生物形成一套可读的协作语法。</p>
              </article>
            </div>
          </section>

          <section className={styles.creatureSection}>
            <div className={styles.creatureCopy}>
              <div className={styles.sectionMark}>04 / CREATURE DESIGN</div>
              <h2>成长不是变大，<br />是学会解释自己。</h2>
              <p>残响生物源于强烈、重复或未完成的记忆，但不是那段记忆的道具。最终形态表示它获得了更完整的自我解释。</p>
              <div className={styles.creatureTags}><span>稳定核心</span><span>同行记忆</span><span>两种最终解释</span></div>
            </div>
            <div className={styles.evolution}>
              {['1', '2', '3'].map((stage, index) => (
                <div key={stage}>
                  <div className={styles.evolutionImage}><Image src={`/projects/forgetting-tide/creatures/lamp-rabbit-${stage}.png`} alt={`灯尾兔第 ${stage} 阶段形态`} fill sizes="(max-width: 900px) 33vw, 20vw" /></div>
                  <span>STAGE 0{index + 1}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.musicSection}>
            <div className={styles.sectionHeading}>
              <div><span>05</span><p>ORIGINAL SOUNDTRACK</p></div>
              <h2>让每个场景<br />拥有自己的潮汐。</h2>
              <p>四首原创程序化循环配乐已接入 Music / SFX 总线与场景交叉淡化。点击曲目即可试听。</p>
            </div>
            <MusicPlayer />
          </section>

          <section className={styles.gallerySection}>
            <div className={styles.sectionMark}>06 / FIELD NOTES</div>
            <div className={styles.galleryIntro}>
              <h2>从世界规则，<br />到可被验证的界面。</h2>
              <p>以下画面均来自当前原型；首屏主视觉在既有视觉锚点基础上进行了展示级重绘。</p>
            </div>
            <div className={styles.galleryGrid}>
              {gallery.map((item) => (
                <figure key={item.src}>
                  <div><Image src={item.src} alt={item.alt} fill sizes="(max-width: 700px) 100vw, 50vw" /></div>
                  <figcaption><span>{item.label}</span><i>{item.kind}</i></figcaption>
                </figure>
              ))}
              <figure className={styles.wideGallery}>
                <div><Image src="/projects/forgetting-tide/concepts/visual-anchor.png" alt="遗忘潮汐视觉锚点：灯塔与残响生物" fill sizes="100vw" /></div>
                <figcaption><span>07 · 淹没世界与记忆灯塔</span><i>VISUAL ANCHOR</i></figcaption>
              </figure>
            </div>
          </section>

          <section className={styles.outcomeSection}>
            <div>
              <div className={styles.sectionMark}>07 / OUTCOME</div>
              <h2>半成品，<br />但不是空想。</h2>
            </div>
            <div className={styles.outcomes}>
              <article><span>已完成</span><p>核心循环、持久探索地图、回合战斗、三重现实映照、营地恢复、存档与内容校验。</p></article>
              <article><span>制作资产</span><p>完整商业企划、世界设定集、20 只生物数据、场景与生物美术、原创配乐和音效。</p></article>
              <article><span>下一阶段</span><p>把灰盒界面替换为统一卡片表现，完成序章与灰烬医院第一章的叙事垂直切片。</p></article>
            </div>
            <div className={styles.closingQuote}>
              <p>灯塔真正需要守住的，并不是永不熄灭的旧世界。</p>
              <strong>而是人们仍有能力共同决定，接下来要记住什么。</strong>
            </div>
          </section>

          <div className={styles.backLink}><Link href="/projects">← 返回项目归档</Link><span>END OF CASE STUDY · 2026</span></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
