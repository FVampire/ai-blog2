import Image from "next/image";

import styles from "./capabilities.module.css";
import { SHOWCASE_MEDIA } from "./showcase-media";

const capabilities = [
  [
    "01 / MULTIMODAL REASONING",
    "看懂一件衣服的结构语言。",
    "从整身图、细节图和自然语言中提取领袖、门襟、省道、闭合与层次关系。StyleGraph 将视觉信息组织成可执行的结构描述，保留不对称、叠穿和材料层次。",
    ["多图理解", "结构关系图", "面料与层次"],
  ],
  [
    "02 / COMPOSABLE PATTERN ENGINE",
    "把复杂款式，编排成制版操作。",
    "从基础原型出发，组合胸省与腰省、公主线分片、裹式搭量、泡袖切展、挂面、里布和粘合衬派生。Planner 按依赖顺序组织操作，让款式变化建立在可计算的几何上。",
    ["基础原型", "组合式操作", "组件派生"],
  ],
  [
    "03 / CONSTRAINT-DRIVEN GEOMETRY",
    "一次改版，重算整套关联纸样。",
    "胸围松量、袖山、袖窿与袖肥共同参与制版计算。自然语言变化形成 SpecDelta，驱动规格更新、纸样重出版与尺寸对照，相关裁片在同一轮计算中更新。",
    ["参数依赖", "全量重出版", "尺寸差异"],
  ],
  [
    "04 / ENGINEERING VALIDATION",
    "让每一条缝线，都有检查依据。",
    "独立检查轮廓闭合、自相交、缝合边长度、吃势和装配关系；把纱向、刀口、钻孔与工艺线组织进纸样数据。模型解释设计，确定性程序核对几何。",
    ["拓扑检查", "缝长配伍", "工艺标记"],
  ],
  [
    "05 / CONNECTED DESIGN VIEWS",
    "设计、结构、纸样，同源查看。",
    "概念外观、Three.js 结构预览与 2D 纸样共同服务于一套设计。衣身、领袖与辅片通过 PatternGraph 组织，帮助设计师从外观逐层深入到裁片关系。",
    ["款式视图", "3D 结构", "2D 纸样"],
  ],
  [
    "06 / REPLAYABLE PROJECTS",
    "让每一次调整，都能回到源头。",
    "保存设计规格、修改意图、几何结果和样衣实测记录。版本快照与可重放的结构化数据，让改版原因、尺寸变化和交付文件保持对应。",
    ["SpecDelta", "版本快照", "样衣反馈"],
  ],
] as const;

export function CaseBreakdown() {
  return (
    <section className={styles.case} id="case-study">
      <div className={styles.caseIntro}>
        <p className={styles.kicker}>ENGINEERED FROM A REAL DESIGN</p>
        <h2>
          一张复杂款式图，
          <br />
          展开成一套制版工程。
        </h2>
        <p>
          不对称交叠、泡袖、撞色边与腰部五金，看起来只是几处设计细节，背后却是裁片派生、结构变换和装配关系的协同。
        </p>
        <span>缎面裹式上衣 / 项目实际会话案例</span>
      </div>
      <div className={styles.metrics}>
        {[
          ["11", "项款式结构操作", "从不对称前片到五金定位"],
          ["14", "个关联裁片", "由同一份规格组织生成"],
          ["25", "项装配关系检查", "连接衣身、辅片与闭合结构"],
          ["1:1", "原尺寸纸样输出", "A4 / A3 拼接与绘图仪"],
        ].map(([n, t, c]) => (
          <div key={t}>
            <strong>{n}</strong>
            <h3>{t}</h3>
            <p>{c}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CapabilityGrid() {
  return (
    <section className={styles.section} id="capabilities">
      <header>
        <p className={styles.kicker}>
          BEYOND THE INTERFACE / THE ENGINEERING DEPTH
        </p>
        <h2>
          从理解设计，到编排制版。
          <br />
          <span>一整套服装工程能力。</span>
        </h2>
        <p>
          把多模态理解、专业结构操作、确定性几何和交付规范，接入同一条 Agent
          工作流。
        </p>
      </header>
      <div className={styles.grid}>
        {capabilities.map(([no, title, copy, tags]) => (
          <article key={no}>
            <span>{no}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
            <footer>
              {tags.map((t) => (
                <b key={t}>{t}</b>
              ))}
            </footer>
          </article>
        ))}
      </div>
      <div className={styles.operationBand}>
        <span>COMPOSABLE OPERATIONS</span>
        <p>
          胸省塑形 <i>／</i> 公主线分片 <i>／</i> 不对称前片 <i>／</i> 裹式搭量{" "}
          <i>／</i> 泡袖切展 <i>／</i> 挂面与里布 <i>／</i> 腰带与五金 <i>／</i>{" "}
          粘合衬派生
        </p>
      </div>
    </section>
  );
}

export function DesignRange() {
  const items = [
    {
      image: SHOWCASE_MEDIA.tshirt,
      name: "基础针织 T 恤",
      copy: "原型、松量与领口结构",
      no: "01 / ESSENTIAL",
    },
    {
      image: SHOWCASE_MEDIA.wrap,
      name: "不对称裹式上衣",
      copy: "交叠、泡袖、撞色与闭合",
      no: "02 / COMPOSITION",
    },
    {
      image: SHOWCASE_MEDIA.coat,
      name: "收腰层次外套",
      copy: "腰部塑形、领型与结构层次",
      no: "03 / STRUCTURE",
    },
    {
      image: SHOWCASE_MEDIA.sweat,
      name: "休闲卫衣套装",
      copy: "宽松衣身、罗纹与裤装廓形",
      no: "04 / SILHOUETTE",
    },
  ];
  return (
    <section className={styles.section}>
      <header>
        <p className={styles.kicker}>ONE SYSTEM / DIFFERENT DESIGN LANGUAGES</p>
        <h2>
          从日常基础款，
          <br />
          到有结构挑战的设计。
        </h2>
        <p>
          同一套规格、规划与几何体系，承接不同的服装语言。以下款式图来自项目已有设计会话。
        </p>
      </header>
      <div className={styles.range}>
        {items.map((item) => (
          <article key={item.name}>
            <div>
              <Image
                src={item.image}
                alt={item.name}
                width={800}
                height={1200}
                unoptimized
                sizes="(max-width: 760px) 50vw, 300px"
              />
            </div>
            <small>{item.no}</small>
            <h3>{item.name}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
