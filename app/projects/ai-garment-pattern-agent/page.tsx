import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import {
  BOM,
  DESIGN_PROMPT,
  DXF_OUTPUTS,
  MEASUREMENTS,
  OPERATIONS,
  PACK_ITEMS,
  PATTERN_PIECES,
  STRUCTURE,
  VALIDATION,
} from "./pack-data";
import styles from "./pattern-agent.module.css";
import StageNav from "./StageNav";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";

const SITE_NAME = "五月的火";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const BASE_PATH = "/projects/ai-garment-pattern-agent";
const PAGE_IMAGE = `${BASE_PATH}/pattern-complete.webp`;
const PAGE_TITLE = "SEAM · AI 服装打版 Agent - 五月的火";
const PAGE_DESCRIPTION =
  "从一句自然语言款式描述，到可校验、可交付、可回流的女衬衫头版纸样与样衣包。";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${BASE_PATH}` },
  openGraph: {
    type: "article",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}${BASE_PATH}`,
    siteName: SITE_NAME,
    locale: "zh_CN",
    images: [
      {
        url: PAGE_IMAGE,
        width: 1800,
        height: 773,
        alt: "SEAM 自动生成的衬衫纸样",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [PAGE_IMAGE],
  },
};

const sections = [
  { id: "opening", index: "01", title: "一句话到纸样" },
  { id: "difficulty", index: "02", title: "难在哪" },
  { id: "mechanism", index: "03", title: "机制" },
  { id: "evidence", index: "04", title: "证据" },
  { id: "limits", index: "05", title: "边界与路线" },
] as const;

const difficulties = [
  {
    no: "01",
    title: "画得像 ≠ 缝得上",
    copy: "模型能画出像纸样的图，却不能保证闭合、配对和可缝合。7 类纸样展开为 14 个裁片，关键缝合边必须严格配伍；厘米级偏差到了样衣室，就是一块废布。",
    answer: "几何交给确定性内核，模型只到结构为止。",
  },
  {
    no: "02",
    title: "结构是依赖图，不是参数表",
    copy: "落肩增加 2.5cm，会连带袖窿深、袖山高、袖肥和袖长基准全部重算。每个参数都在一张关系网里。",
    answer: "系统保存 pattern.graph.json，而不是一组互不相干的数字。",
  },
  {
    no: "03",
    title: "自然语言天然欠定",
    copy: "“略宽松的通勤衬衫”缺少松量、门襟宽、领座高、下摆弧度等十几个可裁参数。补全策略决定系统是在协助，还是在胡编。",
    answer: "缺项必须人工确认，规格锁定后才进入制版。",
  },
  {
    no: "04",
    title: "可裁 ≠ 可交",
    copy: "纱向、刀口、钻孔、缝份和片名，缺一样，文件到了工厂都可能失效。这部分没有智能捷径，只有完整或不完整。",
    answer: "校验单独检查生产注释完整性，ERROR 会阻断导出。",
  },
] as const;

const mechanismBlocks = [
  {
    no: "01—02",
    title: "输入与结构",
    lead: "把口述、参考图和基码写成一份可确认的 GarmentSpec。模型负责理解，人工负责补齐和锁定。",
    input: "描述 / 参考图 / 165/84A",
    output: "garment-spec.json",
  },
  {
    no: "03—04",
    title: "生成与校验",
    lead: "确定性 CAD 内核按依赖图生成纸片，再检查配对长度、几何合法性和生产注释。",
    input: "GarmentSpec",
    output: "pattern.graph.json / validation.json",
  },
  {
    no: "05—06",
    title: "工艺包",
    lead: "纸样之外，样衣室还需要工艺卡、BOM、参考用量、成衣尺寸和版本记录。",
    input: "校验通过的 PatternGraph",
    output: "head-sample-pack",
  },
  {
    no: "07—08",
    title: "导出与回流",
    lead: "按 1:1、毫米单位导出 DXF-AAMA；样衣反馈结构化回传，再重跑纸样与技术包。",
    input: "DXF + 样衣反馈",
    output: "1:1 plot / V2 spec",
  },
] as const;

const boundaryCases = [
  {
    title: "连衣裙",
    at: "结构解析后停止",
    message: "UNSUPPORTED_CATEGORY · dress",
    copy: "当前白名单只有女式基础衬衫，不会借用衬衫模块强行拼出裙装。",
  },
  {
    title: "针织",
    at: "材料确认时停止",
    message: "UNSUPPORTED_MATERIAL · knit",
    copy: "负松量、弹性回复和缝制工艺超出当前梭织几何模型。",
  },
  {
    title: "多码推档",
    at: "导出前停止",
    message: "GRADING_RULES_REQUIRED",
    copy: "现阶段只验证单基码；没有推档规则时，不自动外推 S / M / L。",
  },
] as const;

const routes = [
  ["NOW", "单基码女衬衫", "165/84A · V1 头版验证"],
  ["NEXT", "推档 S / M / L", "建立关键点与围度推档规则"],
  ["THEN", "第二品类", "以结构白名单扩展，而不是通用品类承诺"],
  ["LATER", "面料库与排料", "把缩水、门幅和真实唛架接入用量计算"],
] as const;

// TEMP_ASSET: generated visuals. Replace src values when real sample-room evidence exists.
// The temporary state intentionally stays in source and is never rendered as a badge or label.
const evidenceAssets = {
  sample: `${BASE_PATH}/evidence-head-sample.webp`,
  overlay: `${BASE_PATH}/evidence-pattern-overlay.webp`,
} as const;

// TODO(evidence): add verified downloadUrl, repositoryUrl and contactUrl before exposing those actions.

function SectionHead({
  index,
  eyebrow,
  title,
  copy,
  inverse = false,
}: {
  index: string;
  eyebrow: string;
  title: string;
  copy: string;
  inverse?: boolean;
}) {
  return (
    <header className={styles.sectionHead} data-inverse={inverse || undefined}>
      <span>{index}</span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p>{copy}</p>
    </header>
  );
}

function IoBand({ input, output }: { input: string; output: string }) {
  return (
    <div className={styles.ioBand}>
      <div>
        <span>输入</span>
        <b>{input}</b>
      </div>
      <i>→</i>
      <div>
        <span>产出</span>
        <b>{output}</b>
      </div>
    </div>
  );
}

export default function GarmentPatternAgentPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero} id="hero">
          <div className={styles.heroTopline}>
            <div>
              <Link href="/">首页</Link>
              <i>/</i>
              <Link href="/projects">项目</Link>
              <i>/</i>
              <span>SEAM</span>
            </div>
            <span>HEAD SAMPLE PACK · 2026</span>
          </div>
          <div className={styles.heroBody}>
            <div className={styles.heroTitle}>
              <p>AI GARMENT PATTERN AGENT</p>
              <h1>SEAM</h1>
            </div>
            <div className={styles.heroStatement}>
              <p>一句话，生成一套能被检查、能进样衣室的头版纸样。</p>
              <span>
                模型负责理解服装结构，确定性 CAD
                内核负责曲线和配对；任何欠定信息、超范围结构和工业错误都会在导出前被显式拦截。
              </span>
            </div>
          </div>
          <dl className={styles.heroMeta}>
            <div>
              <dt>SCOPE</dt>
              <dd>女衬衫 / 165/84A</dd>
            </div>
            <div>
              <dt>CORE</dt>
              <dd>Spec + CAD Kernel</dd>
            </div>
            <div>
              <dt>OUTPUT</dt>
              <dd>样衣包 / DXF / 1:1</dd>
            </div>
            <div>
              <dt>STATUS</dt>
              <dd>First Sample</dd>
            </div>
          </dl>
        </section>

        <div className={styles.workspace}>
          <StageNav stages={sections} />
          <div className={styles.story}>
            <section
              className={`${styles.section} ${styles.opening}`}
              id="opening"
            >
              <SectionHead
                index="01"
                eyebrow="FROM LANGUAGE TO GEOMETRY"
                title="一句话 → 一套纸样"
                copy="一段自然语言定义款式、基码与工艺约束；系统将它展开为带缝份、纱向、刀口和钻孔的可裁纸片。"
              />
              <div className={styles.contrastGrid}>
                <figure className={styles.promptPanel}>
                  <figcaption>
                    <span>INPUT</span>
                    <b>DESIGN_PROMPT</b>
                  </figcaption>
                  <blockquote>“{DESIGN_PROMPT}”</blockquote>
                  <small>Natural language brief · 01</small>
                </figure>
                <figure className={styles.patternHero}>
                  <Image
                    src={`${BASE_PATH}/pattern-complete.webp`}
                    alt="由款式描述生成的完整女衬衫纸样"
                    fill
                    priority
                    sizes="(max-width: 880px) 100vw, 60vw"
                  />
                  <figcaption>
                    <span>OUTPUT</span>
                    <b>COMPLETE PATTERN</b>
                  </figcaption>
                </figure>
              </div>
              <dl className={styles.numberBand}>
                <div>
                  <dt>01</dt>
                  <dd>段自然语言输入</dd>
                </div>
                <div>
                  <dt>07</dt>
                  <dd>类纸样 · 14 个裁片</dd>
                </div>
                <div>
                  <dt>12</dt>
                  <dd>道样衣工序</dd>
                </div>
                <div>
                  <dt>05</dt>
                  <dd>个交付文件</dd>
                </div>
              </dl>
            </section>

            <section
              className={`${styles.section} ${styles.difficulty}`}
              id="difficulty"
            >
              <SectionHead
                index="02"
                eyebrow="THE HARD PART"
                title="难的不是把图画出来"
                copy="真正的工作是把服装语言变成一组相互依赖、可缝合、可被工厂消费的确定数据。"
              />
              <div className={styles.difficultyGrid}>
                {difficulties.map((item) => (
                  <article key={item.no}>
                    <span>{item.no}</span>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                    <strong>→ {item.answer}</strong>
                  </article>
                ))}
              </div>
            </section>

            <section
              className={`${styles.section} ${styles.mechanism}`}
              id="mechanism"
            >
              <SectionHead
                index="03"
                eyebrow="HOW IT WORKS"
                title="从结构确认，到样衣回流"
                copy="结构先被确认，几何再由确定性内核生成；工业校验、工艺包和版本回流共同守住交付边界。"
              />

              <article className={styles.mechanismBlock}>
                <header>
                  <span>{mechanismBlocks[0].no}</span>
                  <div>
                    <p>SPECIFICATION</p>
                    <h3>{mechanismBlocks[0].title}</h3>
                  </div>
                  <p>{mechanismBlocks[0].lead}</p>
                </header>
                <IoBand
                  input={mechanismBlocks[0].input}
                  output={mechanismBlocks[0].output}
                />
                <div className={styles.structureGrid}>
                  {STRUCTURE.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <b>{value}</b>
                    </div>
                  ))}
                </div>
                <p className={styles.mechanismNote}>
                  缺失字段进入人工确认；规格未锁定时，系统不会开始自动制版。
                </p>
              </article>

              <article className={styles.mechanismBlock}>
                <header>
                  <span>{mechanismBlocks[1].no}</span>
                  <div>
                    <p>DETERMINISTIC CORE</p>
                    <h3>{mechanismBlocks[1].title}</h3>
                  </div>
                  <p>{mechanismBlocks[1].lead}</p>
                </header>
                <IoBand
                  input={mechanismBlocks[1].input}
                  output={mechanismBlocks[1].output}
                />
                <div className={styles.dualTables}>
                  <div className={styles.tableWrap}>
                    <h4>纸片清单</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>纸片</th>
                          <th>数量</th>
                          <th>生产信息</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PATTERN_PIECES.map(([name, qty, detail]) => (
                          <tr key={name}>
                            <td>{name}</td>
                            <td>{qty}</td>
                            <td>{detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.validationList}>
                    <h4>工业校验</h4>
                    {VALIDATION.map(([title, detail, warn]) => (
                      <div key={title} data-warn={warn || undefined}>
                        <span>{warn ? "WARN" : "PASS"}</span>
                        <b>{title}</b>
                        <small>{detail}</small>
                      </div>
                    ))}
                  </div>
                </div>
                <p className={styles.mechanismNote}>
                  共 7 类纸样，按裁剪数量展开为 14 个裁片。默认缝份 10 mm，领部
                  8 mm，下摆 30 mm。
                </p>
              </article>

              <article className={styles.mechanismBlock}>
                <header>
                  <span>{mechanismBlocks[2].no}</span>
                  <div>
                    <p>TECH PACK</p>
                    <h3>{mechanismBlocks[2].title}</h3>
                  </div>
                  <p>{mechanismBlocks[2].lead}</p>
                </header>
                <IoBand
                  input={mechanismBlocks[2].input}
                  output={mechanismBlocks[2].output}
                />
                <details className={styles.detailPanel}>
                  <summary>
                    <span>工艺操作卡 · 12 道</span>
                    <small>查看完整工序与质量控制</small>
                  </summary>
                  <div className={styles.tableWrap}>
                    <table>
                      <thead>
                        <tr>
                          <th>工序</th>
                          <th>操作</th>
                          <th>工艺要求</th>
                          <th>质量控制</th>
                        </tr>
                      </thead>
                      <tbody>
                        {OPERATIONS.map(([no, name, req, qc]) => (
                          <tr key={no}>
                            <td>{no}</td>
                            <td>{name}</td>
                            <td>{req}</td>
                            <td>{qc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
                <div className={styles.dualTables}>
                  <details className={styles.detailPanel}>
                    <summary>
                      <span>BOM · 头版参考用量</span>
                      <small>查看面辅料、规格与用量</small>
                    </summary>
                    <div className={styles.tableWrap}>
                      <table>
                        <thead>
                          <tr>
                            <th>类别</th>
                            <th>物料</th>
                            <th>规格</th>
                            <th>用量</th>
                            <th>说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          {BOM.map((row) => (
                            <tr key={row[1]}>
                              {row.map((cell, index) => (
                                <td key={`${cell}-${index}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                  <details className={styles.detailPanel}>
                    <summary>
                      <span>成衣尺寸表 · 10 项</span>
                      <small>查看目标值、公差与测量方法</small>
                    </summary>
                    <div className={styles.tableWrap}>
                      <table>
                        <thead>
                          <tr>
                            <th>部位</th>
                            <th>目标 cm</th>
                            <th>公差</th>
                            <th>测量方法</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MEASUREMENTS.map((row) => (
                            <tr key={row[0]}>
                              {row.map((cell, index) => (
                                <td key={`${cell}-${index}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              </article>

              <article className={styles.mechanismBlock}>
                <header>
                  <span>{mechanismBlocks[3].no}</span>
                  <div>
                    <p>EXPORT & FEEDBACK</p>
                    <h3>{mechanismBlocks[3].title}</h3>
                  </div>
                  <p>{mechanismBlocks[3].lead}</p>
                </header>
                <IoBand
                  input={mechanismBlocks[3].input}
                  output={mechanismBlocks[3].output}
                />
                <div className={styles.exportGrid}>
                  <div className={styles.fileList}>
                    {DXF_OUTPUTS.map((name, index) => (
                      <div key={name}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <b>{name}</b>
                        <small>
                          {index === 0 ? "DXF-AAMA · mm · 1:1" : "随样衣包交付"}
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className={styles.packGrid}>
                    {PACK_ITEMS.map(([no, title, copy]) => (
                      <div key={no}>
                        <span>{no}</span>
                        <b>{title}</b>
                        <p>{copy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>

            <section
              className={`${styles.section} ${styles.evidence}`}
              id="evidence"
            >
              <SectionHead
                index="04"
                eyebrow="SHOW THE RECEIPTS"
                title={"把结果放到可\u2060验\u2060证的尺度上"}
                copy="一套系统是否成立，不看它声称做了什么，而看产物能不能被打开、测量、裁剪、缝制和回改。"
              />
              <figure className={styles.sampleFigure}>
                <Image
                  src={evidenceAssets.sample}
                  alt="女衬衫头版样衣、纸样与裁片工作台"
                  fill
                  sizes="(max-width: 880px) 100vw, 78vw"
                />
                <figcaption>
                  <span>EVIDENCE 01</span>
                  <b>1:1 出纸 → 裁片 → 头版样衣</b>
                </figcaption>
              </figure>
              <div className={styles.evidenceGrid}>
                <figure>
                  <div className={styles.evidenceImage}>
                    <Image
                      src={evidenceAssets.overlay}
                      alt="人工版师纸样与 SEAM 纸样的叠图对照"
                      fill
                      sizes="(max-width: 880px) 100vw, 50vw"
                    />
                  </div>
                  <figcaption>
                    <span>EVIDENCE 02 · PATTERN OVERLAY</span>
                    <h3>差异被标出来，比“完全一致”可信</h3>
                    <p>
                      红线代表人工基准，蓝线代表
                      SEAM。对照重点放在肩点、袖山和圆弧下摆，而不是只看轮廓像不像。
                    </p>
                  </figcaption>
                </figure>
                <article className={styles.metricsCard}>
                  <span>EVIDENCE 03 · MEASURED</span>
                  <h3>配对关系可被复算</h3>
                  <dl>
                    <div>
                      <dt>肩缝</dt>
                      <dd>12.42 / 12.39 cm</dd>
                      <small>Δ 0.03 cm</small>
                    </div>
                    <div>
                      <dt>袖山 / 袖窿</dt>
                      <dd>48.10 / 47.72 cm</dd>
                      <small>吃势 0.38 cm</small>
                    </div>
                    <div>
                      <dt>合法纸样</dt>
                      <dd>7 / 7</dd>
                      <small>纸样闭合且无自交</small>
                    </div>
                    <div>
                      <dt>生产注释</dt>
                      <dd>4 / 4</dd>
                      <small>纱向 · 刀口 · 钻孔 · 名称</small>
                    </div>
                  </dl>
                  <p>
                    这些值进入 validation.json；WARN 需要人工判断，ERROR
                    直接阻断 DXF 导出。
                  </p>
                </article>
              </div>
            </section>

            <section
              className={`${styles.section} ${styles.limits}`}
              id="limits"
            >
              <div className={styles.darkPanel}>
                <SectionHead
                  index="05"
                  eyebrow="LIMITS & FAILURE"
                  title={"知道在哪里停，比假\u2060装什么都能做更重要"}
                  copy="白名单、失败信息和改版记录共同定义系统边界。超出能力范围时，它必须给出可定位的停止点。"
                  inverse
                />
                <div className={styles.boundaryGrid}>
                  {boundaryCases.map((item) => (
                    <article key={item.title}>
                      <span>{item.at}</span>
                      <h3>{item.title}</h3>
                      <code>{item.message}</code>
                      <p>{item.copy}</p>
                    </article>
                  ))}
                </div>
                <div className={styles.failureTerminal}>
                  <div>
                    <span>SEAM / RUN 0241</span>
                    <b>STOPPED</b>
                  </div>
                  <pre>{`> parse garment-spec.json\n✓ category: women_shirt\n✓ base_size: 165/84A\n✓ fabric: light_woven\n! grading: S / M / L\n\nERROR  GRADING_RULES_REQUIRED\nNo grade rule set was supplied. Export has been stopped.\nLast valid artifact: pattern.graph.json`}</pre>
                </div>
                <div className={styles.changeLog}>
                  <span>V1 → V2 · CHANGE RECORD</span>
                  <div>
                    <b>袖克夫工艺线</b>
                    <p>0.8 cm → 0.6 cm</p>
                    <small>原因：净袖口处纽扣位置偏离中心线。</small>
                  </div>
                  <div>
                    <b>下领高度</b>
                    <p>3.0 cm → 2.3 cm</p>
                    <small>原因：翻折后上领遮盖不足，领座外露。</small>
                  </div>
                  <div>
                    <b>受影响产物</b>
                    <p>4 files regenerated</p>
                    <small>pattern.graph · DXF · ops · validation</small>
                  </div>
                </div>
              </div>

              <div className={styles.roadmap}>
                <header>
                  <span>STATUS & ROUTE</span>
                  <h2>当前状态，以及接下来真正要做的事</h2>
                </header>
                <div className={styles.routeGrid}>
                  {routes.map(([tag, title, copy]) => (
                    <article key={tag}>
                      <span>{tag}</span>
                      <h3>{title}</h3>
                      <p>{copy}</p>
                    </article>
                  ))}
                </div>
                <div className={styles.notDoing}>
                  <span>明确不做</span>
                  <p>不替代大货审批</p>
                  <p>不做 3D 试衣</p>
                  <p>不做面料物理仿真</p>
                </div>
                <div className={styles.finalStatement}>
                  <p>它不是一个会画纸样图的聊天机器人。</p>
                  <h2>它是一条把自然语言约束成工业交付物的窄而深的生产链。</h2>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className={styles.backLink}>
          <Link href="/projects">← 返回项目归档</Link>
          <span>EXPERIMENTAL · FIRST SAMPLE · NOT FOR BULK PRODUCTION</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
