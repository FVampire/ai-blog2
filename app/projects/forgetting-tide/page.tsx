import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import CaseNav from './CaseNav';
import CastDossier from './CastDossier';
import CompanionGrowth from './CompanionGrowth';
import CoreLoopExplorer from './CoreLoopExplorer';
import styles from './forgetting-tide.module.css';
import MusicPlayer from './MusicPlayer';
import VisionShowcase from './VisionShowcase';
import WorldAtlas from './WorldAtlas';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';

const PAGE_TITLE = '遗忘潮汐 · 完整项目案例';
const PAGE_DESCRIPTION = '叙事构筑游戏《遗忘潮汐》的产品企划、世界设定、系统设计、最终界面、原创配乐与开发过程。';
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAGE_IMAGE = '/projects/forgetting-tide/hero.png';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/projects/forgetting-tide` },
  openGraph: {
    type: 'article',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/projects/forgetting-tide`,
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

const storyBeats = [
  ['P01', '灯还认得你', '姓名被整齐切除，灯塔却认得玩家的手势。', '建立“记忆可以消失，关系仍会留下痕迹”的世界规则。'],
  ['P03', '门后的呼吸', '贴门倾听会读出完整敌人意图；直接推门则抢到先手。', '把叙事动作变成战斗教学，而不是弹出说明框。'],
  ['P05', '修好一条捷径', '花掉破碎记忆修复道路，或保留货币多走两个危险房间。', '第一次让世界恢复与本局资源发生冲突。'],
  ['P07', '空号推床', '稳定灯尾兔影与推床残响，目标不是击杀，而是完成召回。', '引入实体碎片、观察记录与第一只同行生物。'],
  ['C03', '三扇门，一把钥匙', '药房、档案室与地下病区只能先稳定一处。', '路线决定玩家先获得哪一种医院叙述。'],
  ['C13', '同一张班表', '急救、禁闭和育护出现在同一份值班记录中。', '三种互相冲突的证词第一次同时成立。'],
  ['C14', '纸面总护士', '三阶段 Boss 会重写意图、封存技能，并召回被删除的病历。', '玩家用一路保留的证据削弱不同阶段。'],
  ['C15', '最后一次查房', '决定灰烬医院今后以救护院、证言牢床区或育护庭存在。', '地图、敌池、NPC、补给和环境规则被永久改写。'],
];

const realities = [
  ['夜班救护院', '首次锚点提供治疗，药房成为固定补给点。', '精英收益降低，地下证据需要绕路取得。'],
  ['开放证言牢床区', '固定开放精英支路，证词与战利品收益更高。', '没有固定药房，敌人获得更强的警戒意图。'],
  ['灰烬育护庭', '首次实体碎片判定保底，生物来访概率提高。', '地图增加一处会持续扩散的环境危害。'],
];

const factions = [
  ['微光', '预备', '揭示、治疗、聚焦；把溢出治疗转成防护。'],
  ['锈铁', '承伤', '护盾、嘲讽、反震；把承受的压力变成反击。'],
  ['回声', '接续', '复述、回拨、连续行动；重新安排技能发生的时点。'],
  ['幽影', '弱化', '中毒、改目标、处决；拆解敌方最危险的行动。'],
  ['生息', '成长', '再生、持续治疗、跨回合积累；让优势逐步扩大。'],
];

const gallery = [
  { src: '/projects/forgetting-tide/screenshots/expedition.png', label: '远征地图', kind: 'GAMEPLAY' },
  { src: '/projects/forgetting-tide/screenshots/battle.png', label: '回合战斗', kind: 'COMBAT' },
  { src: '/projects/forgetting-tide/screenshots/creature-skills.png', label: '生物构筑', kind: 'BUILD' },
  { src: '/projects/forgetting-tide/screenshots/camp.png', label: '营地灰盒', kind: 'PROCESS' },
];

const memoryLayers = [
  ['表层', '姓名、日期、编号。潮汐第一批带走，且不留痕迹。'],
  ['中层', '事件、因果、谁对谁做了什么。需要有人复述，才留得下。'],
  ['底层', '手势、气味、走惯的那条路。潮汐碰不到，身体先记得。'],
  ['残响', '被带走的部分不会消失。它们脱离主人，长成会动的形状。'],
];

const worldRegions = [
  ['微光林线', '微光', '会自己发光的林带，夜里比白天亮。'],
  ['锈铁荒原', '锈铁', '旧护甲与机械残骸堆成的坡，风一吹整片在响。'],
  ['回声群岛', '回声', '说出去的话会隔几天从另一座岛回来。'],
  ['幽影裂谷', '幽影', '光进不去，只有被观察过的东西才有形状。'],
  ['生息湿垣', '生息', '拆掉多久都会重新长回来的墙。'],
];

const sealedChapters = [
  ['C2', '锈铁荒原 · 一列还在报站的火车', '列车每天准点报出十七个站名，其中十一个已经不存在。乘客仍在上车。', '设定完成，资产未制作'],
  ['C3', '回声群岛 · 同一句话的三种版本', '一句遗言隔着不同的岛回来三次，措辞每次都不同，且三次都有物证。', '章节大纲'],
  ['C4', '幽影裂谷 · 光进不去的病房', '裂谷里的东西只有被观察时才有形状。有人利用这一点藏了一整层楼。', '概念阶段'],
  ['C5', '生息湿垣 · 拆不掉的那道墙', '墙每次被推倒都会重新长回来，长回来的位置比上一次偏三米。', '概念阶段'],
];

export default function ForgettingTidePage() {
  return (
    <div>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <Image src="/projects/forgetting-tide/hero.png" alt="寻潮者与三只残响生物走向记忆灯塔" fill priority sizes="100vw" />
          <div className={styles.heroShade} />
          <div className={styles.heroTopline}>
            <div className={styles.breadcrumbs}><Link href="/">首页</Link><i>/</i><Link href="/projects">项目</Link><i>/</i><span>遗忘潮汐</span></div>
            <span>COMPLETE GAME DESIGN CASE · 2026</span>
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>NARRATIVE ROGUELITE · SYSTEM DESIGN · WORLD BUILDING · ORIGINAL SCORE</p>
            <h1>遗忘潮汐</h1><div className={styles.englishTitle}>THE FORGETTING TIDE</div>
            <p className={styles.lead}>带领三只残响生物进入不断改写自身的遗迹。队伍决定你能取得什么证据，而你选择保留的证词，将成为下一次远征里的道路、敌人与居民。</p>
          </div>
          <div className={styles.heroMeta}>
            <div><span>PRODUCT</span><b>单机叙事构筑 Roguelite</b></div><div><span>ROLE</span><b>主创 / 企划 / 系统 / 音乐</b></div><div><span>PLATFORM</span><b>Windows PC · Godot 4</b></div><div><span>DELIVERABLE</span><b>完整产品方案与可玩版本</b></div>
          </div>
        </section>

        <div className={styles.caseBody}>
          <CaseNav />

          <section className={styles.manifesto} id="overview">
            <div className={styles.sectionMark}>00 / PRODUCT OVERVIEW</div>
            <div className={styles.overviewGrid}>
              <div><h2>玩家不是判断谁说了真话，<br />而是决定哪一种现实会留下来。</h2><p>《遗忘潮汐》把剧情选择放进核心循环：队伍构筑决定调查能力，远征路线决定能找到哪些旁证，章节结尾的映照再把选择写回地图、生态与战斗规则。</p></div>
              <div className={styles.deliveryList}><span>本案例覆盖</span><p>商业企划与世界设定</p><p>序章、首章与事件链</p><p>战斗、技能池与生物生态</p><p>Godot 游戏版本与数据工具</p><p>最终界面与原创配乐</p></div>
            </div>
            <div className={styles.factStrip}><div><strong>20</strong><span>只阵容生物 · 三阶段成长</span></div><div><strong>5</strong><span>种资源 · 五套行动语法</span></div><div><strong>6</strong><span>段首章流程 · 三种永久现实</span></div><div><strong>4</strong><span>首场景循环配乐 · 完整试听</span></div></div>
          </section>

          <section className={styles.worldChapter} id="world">
            <div className={styles.sectionHeading}><div><span>01</span><p>WORLD</p></div><h2>潮汐不带走东西，<br />它带走东西之间的关系。</h2><p>先认识维拉汀，以及这个世界为什么把“仍被记得”当作一种能源。</p></div>
            <WorldAtlas />
            <div className={styles.worldColumns}>
              <div className={styles.worldCopy}>
                <p>维拉汀不缺记录。它缺的是记录之间还连着的那根线。每隔一段时间，遗忘潮汐从断名海涌上来，漫过城邦、病院与档案馆。潮水退去后，纸还在，字还在，只是没有人能说清这一页属于谁、又为什么被写下。</p>
                <p>于是维拉汀人学会了一件事：与其抢救记录，不如抢救关系。潮灯之家是最后一座还在运转的灯塔，它不靠燃料，靠“仍被记得”发光。你，一名姓名已被整齐切除的寻潮者，带着三只由残响长成的生物，走回那些还没被完全冲散的地方。</p>
              </div>
              <div className={styles.memoryLayers}>
                {memoryLayers.map(([label, copy]) => <div key={label}><b>{label}</b><span>{copy}</span></div>)}
              </div>
            </div>
            <div className={styles.regionGrid}>
              {worldRegions.map(([region, attribute, copy]) => <article key={region}><span>{attribute}</span><h3>{region}</h3><p>{copy}</p></article>)}
            </div>
            <p className={styles.regionNote}>灰烬医院位于幽影裂谷与断名海之间的滩地——这里的事物，只有被观察时才有形状。</p>
            <p className={styles.worldRule}>潮汐不销毁事物，只销毁事物之间的联系。所以在维拉汀，遗忘不是空白，是错位。</p>
          </section>

          <section className={styles.castSection} id="cast">
            <div className={styles.sectionHeading}><div><span>02</span><p>CAST</p></div><h2>姓名被切除以后，<br />还剩什么可以认人。</h2><p>身份会被潮汐剥离，立场、物证与付过的代价却仍能互相指认。</p></div>
            <CastDossier />
          </section>

          <section className={styles.antagonistSection} id="antagonist">
            <div className={styles.sectionHeading}><div><span>03</span><p>ANTAGONIST</p></div><h2>当制度写下恐惧，<br />纸页会替它继续执行。</h2><p>灰烬医院的最终敌人不是某个恶人，而是一条被重复到获得形状的命令。</p></div>
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
          </section>

          <section className={styles.companionChapter} id="companions">
            <CompanionGrowth />
          </section>

          <section className={styles.storySection} id="story">
            <div className={styles.sectionHeading}><div><span>05</span><p>STORY CASE</p></div><h2>灰烬医院：<br />三种都成立的证词</h2><p>医院救过人，也囚禁过人；被制度放大的恐惧，最后真的长成了实体。首章围绕这三件事逐层给出证据。</p></div>
            <div className={styles.storyBody}>
              <div className={styles.storyTimeline}>{storyBeats.map(([code, title, scene, consequence], index) => <details key={code} open={index === 0}><summary><span>{code}</span><div><b>{title}</b><small>{scene}</small></div><i>＋</i></summary><p><strong>这一段改变什么</strong>{consequence}</p></details>)}</div>
              <aside className={styles.storyAside}><span>CHAPTER ROUTE</span><h3>从失去姓名，到决定医院如何继续存在</h3><ol><li>学习倾听意图</li><li>修复第一条道路</li><li>召回第一只生物</li><li>收集三组互斥证词</li><li>用证据改写 Boss 阶段</li><li>固定医院的主映照</li></ol></aside>
            </div>
            <div className={styles.realityCompare}><div className={styles.compareHeading}><span>PERMANENT REFLECTION</span><h3>同一座医院，三套可继续游玩的现实</h3></div>{realities.map(([name, gain, cost]) => <article key={name}><h4>{name}</h4><p><b>获得</b>{gain}</p><p><b>代价</b>{cost}</p></article>)}</div>
          </section>

          <section className={styles.loopSection} id="gameplay">
            <div className={styles.sectionHeading}><div><span>06</span><p>CORE LOOP</p></div><h2>刚才那一章，<br />是怎么被拆成六步的。</h2><p>灰烬医院的证词、路线与最终映照，被拆进一局的六个连续决策；每一步都把结果交给下一步。</p></div>
            <CoreLoopExplorer />
          </section>

          <section className={styles.atlasSection} id="systems">
            <div className={styles.sectionHeading}><div><span>07</span><p>SYSTEM DESIGN</p></div><h2>战斗、技能与生物生态</h2><p>展开查看规则层。三个系统使用同一组属性、资源与身份数据，因此每次成长都会同时改变战斗和叙事表达。</p></div>
            <div className={styles.atlasList}>
              <details open><summary><span>01</span><div><b>五种属性，五种资源用法</b><small>克制提供效率，资源决定行动方式</small></div><i>＋</i></summary><div className={styles.atlasContent}><div className={styles.factionCycle}>微光 <i>→</i> 幽影 <i>→</i> 回声 <i>→</i> 锈铁 <i>→</i> 生息 <i>→</i> 微光</div><div className={styles.factionGrid}>{factions.map(([name, verb, copy], index) => <article key={name} data-tone={index}><span>0{index + 1}</span><h3>{name}</h3><b>{verb}</b><p>{copy}</p></article>)}</div></div></details>
              <details><summary><span>02</span><div><b>共享技能池与构筑资格</b><small>属性、种族和战术倾向共同决定可装配技能</small></div><i>＋</i></summary><div className={styles.atlasContent}><div className={styles.systemNumbers}><div><strong>20—30</strong><span>通用主动</span></div><div><strong>60—80</strong><span>阵营主动</span></div><div><strong>80—100</strong><span>种族主动</span></div><div><strong>40+</strong><span>标志技能</span></div><div><strong>400</strong><span>天赋内容池</span></div></div><p className={styles.atlasNote}>同一项“荆棘外衣”，微光强化会长出荆棘，生息强化增加护盾，锈铁强化保留反击层数，幽影强化则施加中毒。技能名称不变，队伍语法会改变它的用途。</p></div></details>
              <details><summary><span>03</span><div><b>观察、召回与同行成长</b><small>生物通过世界关系加入，而不是从抽卡池里出现</small></div><i>＋</i></summary><div className={styles.atlasContent}><div className={styles.ecologyPaths}><article><span>ENTITY RECALL</span><h3>实体召回</h3><p>观察明确个体，收集仍指向它的碎片，再由灯塔稳定核心。主线生物拥有确定性路径。</p></article><article><span>ECOLOGICAL VISIT</span><h3>生态来访</h3><p>先恢复道路与栖息关系，再发出不包含服从命令的信标。随机只决定谁先回应。</p></article><article><span>COMPANION MEMORY</span><h3>同行成长</h3><p>三阶段轮廓保留稳定核心，最终形态由同行记忆与两条自我解释分支决定。</p></article></div></div></details>
            </div>
          </section>

          <section className={styles.visionSection} id="product"><div className={styles.sectionHeading}><div><span>08</span><p>FINAL PRODUCT UI</p></div><h2>最终产品系统界面</h2><p>图鉴、技能池与见证墙共用一套暗潮材质、信息层级和交互语法，复杂规则在同一屏内完成预览与决策。</p></div><VisionShowcase /></section>

          <section className={styles.processSection} id="process">
            <div className={styles.sectionHeading}><div><span>09</span><p>DEVELOPMENT PROCESS</p></div><h2>一座营地，<br />从功能骨架到最终画面</h2><p>同一个空间经过三轮处理：先验证移动与功能分区，再建立材质、角色和光照，最后把系统入口收进完整的环境叙事与界面层级。</p></div>
            <div className={styles.processRail}>
              <article><div><Image src="/projects/forgetting-tide/screenshots/camp.png" alt="营地的三维灰盒骨架" fill sizes="(max-width: 800px) 100vw, 33vw" /></div><span>01 / STRUCTURE</span><h3>3D 功能骨架</h3><p>确认灯塔、档案台、工坊、潮门、篝火与镜头移动的空间关系。</p></article>
              <article><div><Image src="/projects/forgetting-tide/vision/camp-art-pass.png" alt="营地披上美术素材后的中央庭院" fill sizes="(max-width: 800px) 100vw, 33vw" /></div><span>02 / ART PASS</span><h3>材质与场景整合</h3><p>统一湿石、黄铜、灯光与角色比例，让功能点首先作为地点成立。</p></article>
              <article className={styles.finalProcess}><div><Image src="/projects/forgetting-tide/vision/camp-final.png" alt="遗忘潮汐最终产品营地界面" fill sizes="(max-width: 800px) 100vw, 44vw" /></div><span>03 / FINAL PRODUCT</span><h3>最终营地枢纽</h3><p>资源、编队状态与远征入口被压到边缘；画面主体留给灯塔、同行生物和可恢复的社区。</p></article>
            </div>
            <details className={styles.galleryDisclosure}><summary><div><span>ASSET LIBRARY</span><b>展开查看游戏画面、Boss 与世界资产</b></div><i>＋</i></summary><div className={styles.galleryGrid}>{gallery.map((item) => <figure key={item.src}><div><Image src={item.src} alt={item.label} fill sizes="(max-width: 700px) 100vw, 50vw" /></div><figcaption><span>{item.label}</span><i>{item.kind}</i></figcaption></figure>)}</div></details>
          </section>

          <section className={styles.musicSection} id="soundtrack"><details className={styles.musicDisclosure} open><summary><div><span>10 / ORIGINAL SOUNDTRACK</span><h2>4 首场景循环配乐</h2><p>营地、探索、战斗与映照各自拥有可无缝循环的主题 · 点击收起试听</p></div><i>＋</i></summary><MusicPlayer /></details></section>

          <section className={styles.nextTidesSection} id="next-tides">
            <div className={styles.sectionMark}>11 / NEXT TIDES</div>
            <div className={styles.nextTidesHeading}><h2>灰烬医院只是第一次退潮。</h2><p>以下章节的世界事实已经确定，画面还没做。列在这里，是因为它们决定了第一章为什么长成现在这样。</p></div>
            <div className={`${styles.chapterGrid} ${styles.sealedGrid}`}>
              {sealedChapters.map(([code, title, fact, status]) => <article key={code}><span className={styles.sealedBadge}>SEALED</span><i>{code}</i><h3>{title}</h3><p>{fact}</p><small>{status}</small></article>)}
            </div>
          </section>

          <section className={styles.outcomeSection}><div><div className={styles.sectionMark}>12 / COMPLETE PACKAGE</div><h2>从世界规则，<br />做到玩家看得见的结果。</h2></div><div className={styles.outcomes}><article><span>DESIGN</span><p>商业企划、世界设定、章节事件、战斗规则与内容规模形成同一套产品定义。</p></article><article><span>PRODUCT</span><p>远征、战斗、见证、映照、营地恢复与生物成长组成完整的长期循环。</p></article><article><span>PRESENTATION</span><p>最终界面、场景美术、Boss 概念与原创声音共同建立可辨认的产品气质。</p></article></div><div className={styles.closingQuote}><p>《遗忘潮汐》的设计命题</p><strong>人们仍有能力共同决定，接下来要记住什么。</strong></div></section>
          <div className={styles.backLink}><Link href="/projects">← 返回项目归档</Link><span>END OF CASE STUDY · 2026</span></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
