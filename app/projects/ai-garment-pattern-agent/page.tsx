import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import { ULTIMATE_MEDIA as media } from "./ultimate-media";
import styles from "./ultimate.module.css";
import UltimateWorkbench from "./UltimateWorkbench";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";

const description =
  "SEAM 服装研发 AI 工程系统：连接款式理解、四视图、组合式制版、虚拟试衣、物料成本与样衣复核，让每一次设计变化贯穿整套服装工程。";
export const metadata: Metadata = {
  title: { absolute: "SEAM · 让服装研发成为一套可计算的系统 - 五月的火" },
  description,
  alternates: {
    canonical: "https://www.fvampire.top/projects/ai-garment-pattern-agent",
  },
  openGraph: {
    title: "SEAM · 服装研发的 AI 工程系统",
    description,
    images: [{ url: media.studio, alt: "SEAM 服装研发一体化工作台产品设计" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEAM · 服装研发的 AI 工程系统",
    description,
    images: [media.studio],
  },
};
const capabilities = [
  [
    "01",
    "把款式理解成结构",
    "参考图、自然语言与尺寸表共同形成 StyleGraph。部件、层次、对称与装配关系，都成为可继续操作的设计信息。",
    "多模态输入 / 款式语义",
  ],
  [
    "02",
    "组合出复杂版型",
    "以基础原型为起点，按依赖组合领、袖、门襟、省道、褶裥、挂面与材料层。把复杂设计展开为一组有顺序的制版操作。",
    "Pattern Planner / 组件编排",
  ],
  [
    "03",
    "让精度有据可查",
    "曲线、裁片、缝长与刀口交给确定性 CAD 内核。保留规格到参数、参数到几何的计算依据，深入到每条线的来源。",
    "毫米坐标 / 几何与缝长校验",
  ],
  [
    "04",
    "让材料理解纸样",
    "主料、衬料和净版模板按层组织，裁量与面积参与用量计算；纽扣、缝纫线与标识共同进入 BOM，连接成本与制作位置。",
    "分层 BOM / 用量依据",
  ],
  [
    "05",
    "把一次修改传到全局",
    "用明确的参数差异发起改版，对照受影响的裁片、物料和 POM。每轮更新都有上下文、计算结果与可回看的版本。",
    "SpecDelta / 影响范围 / 版本",
  ],
  [
    "06",
    "让样衣反馈回到设计",
    "目标尺寸、工艺补偿、测量方法和公差共同定义验收。实测偏差定位到部位，让下一轮改版从证据出发。",
    "POM / 公差 / 样衣复核",
  ],
];

export default function GarmentPatternAgentPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.page}>
        <div className={styles.topline}>
          <Link href="/projects">← 项目归档</Link>
          <span>PRODUCT DESIGN & ENGINEERING / 2026</span>
        </div>
        <section className={styles.hero}>
          <div className={styles.brand}>
            SEAM<span>✳</span>
            <small>
              AI GARMENT
              <br />
              ENGINEERING STUDIO
            </small>
          </div>
          <div className={styles.heroCopy}>
            <div>
              <p className={styles.kicker}>从设计表达，到整套服装工程</p>
              <h1>
                让服装研发，
                <br />
                <span>成为一套可计算的系统。</span>
              </h1>
            </div>
            <div className={styles.lead}>
              <p>
                看懂款式，编排制版，预览成衣，计算物料，复核样衣。让一次设计变化，贯穿整套工程。
              </p>
              <a className={styles.primary} href="#workspace">
                进入产品工作台 <span>↗</span>
              </a>
              <a className={styles.textLink} href="#engineering">
                深入制版内核 ↓
              </a>
            </div>
          </div>
          <figure className={styles.screen}>
            <Image
              src={media.studio}
              alt="SEAM 终极版设计中枢：设计对话、蓝衬衫效果、四视图、参数差异与工程资产"
              width={1440}
              height={1000}
              priority
              unoptimized
            />
            <figcaption>
              <span>THE CONNECTED WORKSPACE</span>
              <span>一个款式，一套连续的工程上下文。</span>
            </figcaption>
          </figure>
          <div className={styles.ribbon}>
            <span>款式与四视图</span>
            <i>→</i>
            <span>纸样与装配</span>
            <i>→</i>
            <span>虚拟试衣</span>
            <i>→</i>
            <span>物料与成本</span>
            <i>→</i>
            <span>样衣与交付</span>
          </div>
        </section>

        <section className={styles.case}>
          <div>
            <p className={styles.kicker}>
              ONE SHIRT. A COMPLETE ENGINEERING RECORD.
            </p>
            <h2>
              看见一件衬衫。
              <br />
              <span>背后是一整套工程资产。</span>
            </h2>
          </div>
          <p>
            在项目中实际完成尺码、领型、袖口与工艺补偿调整，再由制版内核生成生产裁片、净版模板和衬片。终极版工作台把这些已有的工程深度，组织成清楚、连贯的产品体验。
          </p>
          <div className={styles.metrics}>
            {[
              ["13", "生产裁片", "衣身、领袖、门襟与过肩"],
              ["8", "净版模板", "描边、定位与工艺辅助"],
              ["4", "粘合衬片", "按材料层独立组织"],
              ["308", "线段计算项", "端点、曲线与参数来源"],
            ].map(([v, t, c]) => (
              <div key={t}>
                <b>{v}</b>
                <h3>{t}</h3>
                <small>{c}</small>
              </div>
            ))}
          </div>
          <small className={styles.source}>
            本次衬衫实际运行记录 · L 码 · 14 条缝合配对
          </small>
        </section>

        <section className={styles.section} id="visual-design">
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>01 / SEE THE WHOLE DESIGN</p>
            <h2>
              从四个视角，
              <br />
              <span>走进同一件衣服。</span>
            </h2>
            <p>
              正面、右侧、背面、左侧共同约束款式表达。把设计细节、服装外观与纸样结构放在一起，形成真正能支持决策的视觉工作区。
            </p>
          </div>
          <div className={styles.visualSplit}>
            <div className={styles.garment}>
              <Image
                src={media.garment}
                alt="浅蓝棉府绸衬衫的完整虚拟成衣产品效果"
                width={1024}
                height={1536}
                unoptimized
              />
              <span>BLUE OXFORD SHIRT / VIRTUAL GARMENT</span>
            </div>
            <div className={styles.visualCopy}>
              <span className={styles.bigNumber}>360°</span>
              <h3>
                衣服的每一面，
                <br />
                都值得被看清。
              </h3>
              <p>
                领型、袖口、门襟、面料与自然垂坠，共同构成成衣的完整表达。切换视角和结构显示，让视觉反馈对应到具体部位。
              </p>
              <div>
                {[
                  ["01", "四视图一致性", "同一款式、同一材质与结构约束。"],
                  ["02", "纸样与三维结构", "裁片身份、缝合配对与刀口锚点。"],
                  ["03", "面料与试衣观察", "材质、网格、拉伸和人体关系。"],
                ].map(([n, t, c]) => (
                  <article key={n}>
                    <span>{n}</span>
                    <div>
                      <h4>{t}</h4>
                      <p>{c}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
          <figure className={styles.fourViews}>
            <Image
              src={media.fourViews}
              alt="同一款蓝衬衫的正面、右侧、背面、左侧概念图"
              width={1536}
              height={1024}
              unoptimized
            />
            <figcaption>
              {["01 / 正面", "02 / 右侧", "03 / 背面", "04 / 左侧"].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </figcaption>
          </figure>
        </section>

        <section className={styles.section} id="workspace">
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>
              02 / THE PRODUCT, IN FIVE WORKSPACES
            </p>
            <h2>
              从一张 BOM，
              <br />
              <span>到整件衣服的物料与成本。</span>
            </h2>
            <p>
              物料编码、材料层、规格、关联裁片、用量依据、成本构成与版本变化，在一张工作台中对齐。继续切换，查看设计、纸样、试衣和样衣复核如何连接。
            </p>
          </div>
          <UltimateWorkbench />
        </section>

        <section className={styles.engineering} id="engineering">
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>03 / THE ENGINE UNDER THE FABRIC</p>
            <h2>
              理解交给 AI。
              <br />
              <span>精度交给几何。</span>
            </h2>
            <p>
              从“像一件衣服”，走向可以编辑、可以计算、可以追溯的服装工程。把模型的理解力与
              CAD 的确定性，放到各自擅长的位置。
            </p>
          </div>
          <div className={styles.capabilities}>
            {capabilities.map(([n, t, c, tag]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{c}</p>
                <small>{tag}</small>
              </article>
            ))}
          </div>
          <div className={styles.engineFlow}>
            {[
              ["StyleGraph", "理解款式"],
              ["Pattern Planner", "编排结构"],
              ["CAD Kernel", "计算与校验"],
              ["Tech Pack", "组织交付"],
            ].map(([t, c]) => (
              <div key={t}>
                <b>{t}</b>
                <small>{c}</small>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.iteration}>
          <div>
            <p className={styles.kicker}>04 / A CHANGE THAT TRAVELS</p>
            <h2>
              “袖长增加 1 cm。”
              <br />
              <span>改变一处，理解全局。</span>
            </h2>
            <p>
              终极版的改版体验，以明确的规格差异为起点。让设计师看见改了什么、影响哪里，以及新版本如何回到纸样、物料和验收尺寸。
            </p>
            <a href="#workspace" className={styles.textLink}>
              查看五个工作区 ↗
            </a>
          </div>
          <div className={styles.changeCard}>
            <header>
              BLUE OXFORD SHIRT <span>V02 → V03</span>
            </header>
            <div className={styles.changeValue}>
              <span>纸样袖长</span>
              <s>590.9</s>
              <b>
                600.9<small>mm</small>
              </b>
              <em>+10</em>
            </div>
            {[
              ["01", "更新设计规格", "保留领型、胸围和门襟设定"],
              ["02", "重新计算纸样", "检查长袖及袖窿装配关系"],
              ["03", "关联物料与成本", "追溯用量计算和受影响部位"],
              ["04", "保留版本与复核", "对照 POM，继续下一轮样衣"],
            ].map(([n, t, c]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{c}</p>
                </div>
                <i>↗</i>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="delivery">
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>05 / READY FOR THE NEXT HANDOFF</p>
            <h2>
              交付的，
              <br />
              <span>是一整套可以继续工作的资料。</span>
            </h2>
            <p>
              设计师、版师和样衣室共享同一套款式上下文，让每次交接保留结构、尺寸与制作依据。
            </p>
          </div>
          <div className={styles.delivery}>
            {[
              [
                "01 / DIGITAL CAD",
                "进入专业 CAD 流程",
                [
                  "SVG 矢量纸样",
                  "DXF · ET / AAMA 图层",
                  "裁线、净线、刀口、布纹与钻孔",
                  "PatternGraph 与计算说明",
                ],
              ],
              [
                "02 / ACTUAL-SIZE PRINT",
                "在纸上，还原每一毫米",
                [
                  "A4 / A3 原尺寸拼接",
                  "裁剪片、净样与粘合衬分组",
                  "绘图仪 1:1 输出",
                  "50 mm 校准框与页面对位",
                ],
              ],
              [
                "03 / SAMPLE PACKAGE",
                "让样衣室拿到完整上下文",
                [
                  "工艺操作卡与质量控制",
                  "分层 BOM 与参考用量",
                  "POM 目标、补偿与公差",
                  "样衣实测、复核人与版本记录",
                ],
              ],
            ].map(([n, t, list]) => (
              <article key={n as string}>
                <span>{n}</span>
                <h3>{t}</h3>
                <ul>
                  {(list as string[]).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.closing}>
          <p className={styles.kicker}>SEAM / AI GARMENT PATTERN AGENT</p>
          <h2>
            从一张款式图，
            <br />
            走向一整套服装工程。
          </h2>
          <a className={styles.primary} href="#workspace">
            再次进入工作台 <span>↗</span>
          </a>
          <p className={styles.designNote}>
            产品界面按完整产品形态设计，融入项目实际运行的纸样与技术包数据；成衣视觉经过优化，成本及样衣实测使用演示参数。
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
