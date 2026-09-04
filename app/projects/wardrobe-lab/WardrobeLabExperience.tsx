"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import styles from "./wardrobe-lab.module.css";

const ASSET = "/uploads/wardrobe-lab-v4";

const looks = [
  { id: "00", name: "原始", en: "SOURCE", src: `${ASSET}/looks/00-source-v4.webp` },
  { id: "01", name: "驼色大衣", en: "COAT", src: `${ASSET}/looks/01-coat-v4.webp` },
  { id: "02", name: "黑色西装", en: "SUIT", src: `${ASSET}/looks/02-suit-v4.webp` },
  { id: "03", name: "银灰夹克", en: "JACKET", src: `${ASSET}/looks/03-jacket-v4.webp` },
  { id: "04", name: "城市街头", en: "STREET", src: `${ASSET}/looks/04-street-v4.webp` },
  { id: "05", name: "西部麂皮", en: "WESTERN", src: `${ASSET}/looks/05-western-v4.webp` },
  { id: "06", name: "未来盔甲", en: "ARMOR", src: `${ASSET}/looks/06-armor-v4.webp` },
  { id: "07", name: "深夜礼服", en: "EVENING", src: `${ASSET}/looks/07-evening-v4.webp` },
] as const;

const stages = [
  { id: "01", name: "输入", en: "INPUT", time: "0.3s", runner: "LOCAL", src: `${ASSET}/pipeline/01-input-v4.webp`, input: "person.webp + garment.webp", output: "00_normalized.webp" },
  { id: "02", name: "抠图", en: "CUTOUT", time: "1.1s", runner: "LOCAL", src: `${ASSET}/pipeline/02-cutout-v4.webp`, input: "00_normalized.webp", output: "01_person_cutout.png" },
  { id: "03", name: "解析", en: "PARSING", time: "1.4s", runner: "ONNX", src: `${ASSET}/pipeline/03-parsing-v4.webp`, input: "00_normalized.webp", output: "02_human_parsing.png" },
  { id: "04", name: "美颜", en: "BEAUTY", time: "0.9s", runner: "LOCAL", src: `${ASSET}/pipeline/04-beauty-v4.webp`, input: "01_cutout + 02_parsing", output: "03_beautified.png" },
  { id: "05", name: "换装", en: "TRY ON", time: "9.8s", runner: "CLOUD", src: `${ASSET}/pipeline/05-dressed-v5.webp`, input: "03_beautified + garment", output: "04_dressed_cutout.png" },
  { id: "06", name: "合成", en: "COMPOSITE", time: "0.7s", runner: "LOCAL", src: `${ASSET}/pipeline/06-final-v4.webp`, input: "04_dressed + 05_background", output: "06_final.png" },
] as const;

const liveLooks = [
  { name: "原始", src: "/projects/wardrobe-lab/lucy/base.mp4" },
  { name: "西装", src: "/projects/wardrobe-lab/lucy/05.mp4" },
  { name: "夹克", src: "/projects/wardrobe-lab/lucy/04.mp4" },
  { name: "街头", src: "/projects/wardrobe-lab/lucy/03.mp4" },
  { name: "西部", src: "/projects/wardrobe-lab/lucy/02.mp4" },
  { name: "盔甲", src: "/projects/wardrobe-lab/lucy/01.mp4" },
] as const;

const failures = [
  { id: "FAIL_01", name: "光源不足", en: "LOW LIGHT", reason: "左侧原图面部曝光不足；右侧虽恢复亮度并完成处理，但细纹被轻微补重，人物产生约数年的年龄漂移。", before: `${ASSET}/failures/01-lowlight-before-v4.webp`, after: `${ASSET}/failures/01-lowlight-after-v4.webp` },
  { id: "FAIL_02", name: "主体与背景近色", en: "LOW CONTRAST", reason: "左侧人物与背景颜色接近；右侧脸部仍然稳定，但袖边、衣摆和发丝出现轻微的局部侵蚀。", before: `${ASSET}/failures/02-lowcontrast-before-v4.webp`, after: `${ASSET}/failures/02-lowcontrast-after-v4.webp` },
  { id: "FAIL_03", name: "像素过低", en: "LOW RES", reason: "左侧保留真实的低像素模糊；右侧虽然补全为高清西装图，有限的面部信息却被重建成了另一个人。", before: `${ASSET}/failures/03-lowres-before-v4.webp`, after: `${ASSET}/failures/03-lowres-after-v4.webp` },
] as const;

const identityFaces = {
  before: "/projects/wardrobe-lab/identity-before.webp",
  after: "/projects/wardrobe-lab/identity-after.webp",
} as const;

const identityLandmarks = {
  before: [
    [32.35, 29.63], [27.6, 39.74], [28.55, 47.6], [29.5, 56.59], [33.3, 65.58], [39, 72.32], [44.7, 76.26], [47.55, 77.94], [50.4, 78.5], [53.25, 77.94], [56.1, 76.26], [61.8, 72.32], [67.5, 65.58], [71.29, 56.59], [72.24, 47.6], [73.19, 39.74], [68.45, 29.63],
    [31.82, 44.69], [35.36, 43.94], [38.46, 43.76], [41.12, 44.31], [43.33, 45.24], [53.96, 45.24], [56.17, 44.31], [58.83, 43.75], [61.93, 43.94], [65.47, 44.68],
    [48.65, 48.03], [48.1, 51.62], [47.62, 55.16], [47.22, 58.08], [43.68, 57.71], [45.67, 59.01], [47.22, 59.94], [48.77, 59.01], [50.76, 57.71],
    [33.55, 47.66], [36.21, 46.84], [38.95, 46.84], [41.61, 47.66], [39.04, 48.51], [36.12, 48.51], [55.69, 47.65], [58.34, 46.84], [61.09, 46.84], [63.75, 47.65], [61.18, 48.51], [58.26, 48.51],
    [39.14, 65.09], [42.46, 64.87], [45.78, 64.65], [48.62, 64.46], [51.47, 64.82], [54.79, 65.25], [58.11, 65.67], [54.79, 66.48], [51.47, 67.29], [48.62, 67.99], [45.78, 67.12], [42.46, 66.11],
    [43.41, 65.22], [46.85, 65.01], [48.62, 64.97], [50.39, 65.01], [53.84, 65.54], [50.39, 66.42], [48.62, 66.56], [46.85, 66.43],
  ],
  after: [
    [32.1, 29.58], [27.33, 39.71], [28.29, 47.58], [29.24, 56.59], [33.05, 65.59], [38.76, 72.34], [44.48, 76.28], [47.33, 77.97], [50.19, 78.53], [53.05, 77.97], [55.9, 76.28], [61.62, 72.34], [67.33, 65.59], [71.14, 56.59], [72.09, 47.58], [73.04, 39.71], [68.28, 29.58],
    [31.55, 44.77], [35.06, 43.98], [38.14, 43.77], [40.79, 44.32], [43, 45.26], [53.56, 45.18], [55.75, 44.21], [58.38, 43.61], [61.46, 43.78], [64.99, 44.52],
    [48.31, 48.09], [47.76, 51.76], [47.28, 55.39], [46.89, 58.38], [43.36, 58.02], [45.36, 59.35], [46.91, 60.29], [48.44, 59.32], [50.41, 57.97],
    [33.29, 47.82], [35.93, 46.96], [38.66, 46.94], [41.3, 47.76], [38.76, 48.65], [35.86, 48.68], [55.3, 47.65], [57.93, 46.79], [60.66, 46.77], [63.31, 47.59], [60.76, 48.49], [57.86, 48.51],
    [39.17, 65.33], [42.49, 65.08], [45.82, 64.82], [48.66, 64.61], [51.51, 64.96], [54.84, 65.37], [58.17, 65.79], [54.85, 66.65], [51.54, 67.5], [48.7, 68.24], [45.84, 67.36], [42.51, 66.35],
    [43.45, 65.44], [46.91, 65.19], [48.67, 65.13], [50.43, 65.17], [53.89, 65.69], [50.44, 66.62], [48.68, 66.76], [46.92, 66.64],
  ],
} as const;

function CompareCard({
  before,
  after,
  title,
  note,
  initial = 50,
  beforeLabel = "原图",
  afterLabel = "结果",
}: {
  before: string;
  after: string;
  title: string;
  note: string;
  initial?: number;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <article className={styles.compareCard}>
      <div className={styles.compareFrame}>
        <img src={after} alt={`${title}处理后`} />
        <div className={styles.compareAfter} style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
          <img src={before} alt={`${title}处理前`} />
        </div>
        <div className={styles.compareLine} style={{ left: `${value}%` }}><span>↔</span></div>
        <span className={styles.beforeLabel}>{beforeLabel}</span>
        <span className={styles.afterLabel}>{afterLabel}</span>
        <input aria-label={`${title || "换装"}前后对比`} type="range" min="0" max="100" value={value} onChange={(event) => setValue(Number(event.target.value))} />
      </div>
      {title && <div className={styles.compareCopy}><h3>{title}</h3><p>{note}</p><output>{String(value).padStart(2, "0")}%</output></div>}
    </article>
  );
}

function FailureCompare({ before, after, label }: { before: string; after: string; label: string }) {
  const [value, setValue] = useState(50);
  return <div className={styles.failureCompare}>
    <div className={styles.compareFrame}>
      <img src={after} alt={`${label}条件下的失败结果`} loading="lazy" />
      <div className={styles.compareAfter} style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
        <img src={before} alt={`${label}边界输入原图`} loading="lazy" />
      </div>
      <div className={styles.compareLine} style={{ left: `${value}%` }}><span>↔</span></div>
      <span className={styles.beforeLabel}>原图</span>
      <span className={styles.afterLabel}>失败结果</span>
      <input aria-label={`${label}失败案例前后对比`} type="range" min="0" max="100" value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </div>
  </div>;
}

function LandmarkPortrait({
  src,
  label,
  points,
}: {
  src: string;
  label: string;
  points: ReadonlyArray<readonly [number, number]>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !image || !context) return;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height || !image.naturalWidth || !image.naturalHeight) return;
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      const imageRatio = image.naturalWidth / image.naturalHeight;
      const frameRatio = width / height;
      const renderedWidth = frameRatio > imageRatio ? height * imageRatio : width;
      const renderedHeight = frameRatio > imageRatio ? height : width / imageRatio;
      const offsetX = (width - renderedWidth) / 2;
      const offsetY = (height - renderedHeight) / 2;
      const point = ([x, y]: readonly [number, number]) => [
        offsetX + (x / 100) * renderedWidth,
        offsetY + (y / 100) * renderedHeight,
      ] as const;

      context.strokeStyle = "rgba(217, 161, 91, 0.92)";
      context.fillStyle = "#f2f0ec";
      context.lineWidth = 1.1;
      const drawGroup = (start: number, end: number, close = false) => {
        context.beginPath();
        points.slice(start, end + 1).forEach((landmark, index) => {
          const [x, y] = point(landmark);
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        if (close) context.closePath();
        context.stroke();
      };

      drawGroup(0, 16);
      drawGroup(17, 21);
      drawGroup(22, 26);
      drawGroup(27, 30);
      drawGroup(31, 35);
      drawGroup(36, 41, true);
      drawGroup(42, 47, true);
      drawGroup(48, 59, true);
      drawGroup(60, 67, true);
      points.forEach((landmark) => {
        const [x, y] = point(landmark);
        context.beginPath();
        context.arc(x, y, 2.1, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      });
    };

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    if (image.complete) draw();
    image.addEventListener("load", draw);
    return () => {
      observer.disconnect();
      image.removeEventListener("load", draw);
    };
  }, [points, src]);

  return <figure className={styles.landmarkPortrait}>
    <img ref={imageRef} src={src} alt={`${label}的人脸关键点`} loading="lazy" />
    <canvas ref={canvasRef} aria-hidden="true" />
    <figcaption>{label} · 68 POINTS</figcaption>
  </figure>;
}

const workbenchModes = [
  { id: "01", name: "换装", en: "TRY ON", detail: "单图五步流水线" },
  { id: "02", name: "视频换装", en: "VIDEO", detail: "成片替换与动作跟随" },
  { id: "03", name: "实时换装", en: "LIVE", detail: "摄像头输入，即时预览" },
  { id: "04", name: "批量处理", en: "BATCH", detail: "队列、命名与分层导出" },
] as const;

const tryOnSteps = [
  { id: "01", name: "抠图", state: "done" },
  { id: "02", name: "身体分析", state: "done" },
  { id: "03", name: "美颜", state: "done" },
  { id: "04", name: "换装", state: "done" },
  { id: "05", name: "换背景", state: "current" },
] as const;

const sceneOptions = [
  { id: "atelier", name: "中性棚拍", src: `${ASSET}/pipeline/05-dressed-v5.webp` },
  { id: "apartment", name: "午后公寓", src: `${ASSET}/pipeline/06-final-v4.webp` },
  { id: "street", name: "城市街头", src: `${ASSET}/looks/04-street-v4.webp` },
] as const;

function WorkbenchPreview() {
  const [scene, setScene] = useState(1);
  const currentScene = sceneOptions[scene];

  return (
    <div className={styles.appWorkbench}>
      <div className={styles.mockTop}>
        <b>WARDROBE LAB</b>
        <span>四种模式 · 当前：换装 / 换背景</span>
        <em>READY</em>
      </div>
      <aside className={styles.capabilityNav} aria-label="工作台模式">
        <b>工作模式</b>
        {workbenchModes.map((mode, index) => (
          <button
            key={mode.id}
            type="button"
            className={index === 0 ? styles.capabilityActive : undefined}
            aria-current={index === 0 ? "page" : undefined}
          >
            <span>{mode.id}</span>
            {mode.name}
          </button>
        ))}
      </aside>
      <div className={styles.wbCanvas}>
        <ol className={styles.pipelineSteps} aria-label="换装模式五步流水线">
          {tryOnSteps.map((step) => (
            <li key={step.id} data-state={step.state}>
              <span>{step.id}</span>
              <b>{step.name}</b>
              <small>{step.state === "current" ? "进行中" : "已完成"}</small>
            </li>
          ))}
        </ol>
        <div className={styles.wbStage}>
          <CompareCard
            before={`${ASSET}/pipeline/05-dressed-v5.webp`}
            after={currentScene.src}
            title=""
            note=""
            initial={46}
            beforeLabel="换装结果"
            afterLabel={currentScene.name}
          />
        </div>
      </div>
      <aside className={styles.wbInspector}>
        <span>智能换景</span>
        <b>换背景</b>
        <p>人物与驼色大衣已经锁定。这一步只替换场景，并重算环境光。</p>
        <div className={styles.wbScenes}>
          {sceneOptions.map((option, index) => (
            <button
              key={option.id}
              type="button"
              className={index === scene ? styles.wbSceneActive : undefined}
              onClick={() => setScene(index)}
              aria-pressed={index === scene}
            >
              <img src={option.src} alt="" />
              <em>{option.name}</em>
            </button>
          ))}
        </div>
        <label className={styles.wbLight}>
          <span>光色协调</span>
          <input type="range" min="0" max="100" defaultValue="68" aria-label="光色协调" />
        </label>
        <button type="button" className={styles.wbDone}>完成</button>
      </aside>
    </div>
  );
}

export default function WardrobeLabExperience() {
  const [stage, setStage] = useState(4);
  const [activeLook, setActiveLook] = useState(1);
  const [liveLook, setLiveLook] = useState(1);
  const [playing, setPlaying] = useState(true);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const currentStage = stages[stage];

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      if (playing) void video.play();
      else video.pause();
    });
  }, [playing]);

  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("section");
    if (target) document.getElementById(target)?.scrollIntoView();
  }, []);

  return <div className={styles.site}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.wordmark}>WARDROBE LAB</Link>
      <nav aria-label="章节导航"><a href="#looks">01 LOOKS</a><a href="#pipeline">02 PIPELINE</a><a href="#compare">03 COMPARE</a><a href="#identity">04 ID</a><a href="#interface">05 UI</a><a href="#live">06 LIVE</a><a href="#architecture">07 ARCH</a><a href="#limits">08 LIMITS</a></nav>
      <div className={styles.status}><i />SYSTEM READY</div>
    </header>

    <main>
      <section className={styles.hero} id="hero">
        <div className={styles.heroImage}><img src={`${ASSET}/backgrounds/empty-atelier-hero.png`} alt="暮色中的无人服装工作室" /><span>WARDROBE / 00</span></div>
        <div className={styles.heroCopy}><p className={styles.kicker}>00 / VIRTUAL WARDROBE SYSTEM</p><h1><span>只换衣服。</span><span><em>不换你。</em></span></h1><p>从输入到成片，每一步都留下可回看的证据。不是一次黑盒调用，而是一条可解释、可重跑、可交付的视觉流水线。</p><a href="#pipeline">亲手拖一遍六阶段 <span>↓</span></a></div>
        <div className={styles.heroMeta}><span>IMAGE / LIVE</span><span>6-STAGE PIPELINE</span><span>LOCAL-FIRST</span></div>
      </section>

      <section className={`${styles.section} ${styles.looksSection}`} id="looks">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>01 / SCALE PROOF</p><h2>一个原图，<br />七次换装。</h2></div><p>人物基准始终留在左边。选择一件服装，右边只更新换装结果，身份、姿态与镜头都不动。</p></header>
        <div className={styles.lookSwitcher}>
          <figure className={styles.sourceLook}>
            <div><img src={looks[0].src} alt="用于换装的人物原图" /></div>
            <figcaption><span><small>00 / SOURCE</small><b>人物原图</b></span><em>IDENTITY BASE</em></figcaption>
          </figure>
          <div className={styles.lookTransfer} aria-hidden="true"><span>TRY ON</span><i>→</i><small>只替换服装</small></div>
          <figure className={styles.resultLook}>
            <div><img key={looks[activeLook].src} src={looks[activeLook].src} alt={`同一人物换上${looks[activeLook].name}的结果`} /><span>RESULT / {looks[activeLook].id}</span></div>
            <figcaption><span><small>{looks[activeLook].id} / {looks[activeLook].en}</small><b>{looks[activeLook].name}</b></span><em>IDENTITY LOCKED</em></figcaption>
          </figure>
        </div>
        <div className={styles.garmentPicker}>
          <div><span>服装选择</span><small>SELECT A LOOK</small></div>
          {looks.slice(1).map((look, index) => {
            const lookIndex = index + 1;
            return <button key={look.id} className={lookIndex === activeLook ? styles.lookActive : ""} onClick={() => setActiveLook(lookIndex)} aria-pressed={lookIndex === activeLook}>
              <img src={look.src} alt="" loading={index > 3 ? "lazy" : undefined} />
              <span><b>{look.name}</b><small>{look.id} / {look.en}</small></span>
              <i>{lookIndex === activeLook ? "●" : "○"}</i>
            </button>;
          })}
        </div>
        <div className={styles.lookReadout}><span>ACTIVE RESULT</span><b>{looks[activeLook].id} · {looks[activeLook].name}</b><p>相同人脸 / 相同姿态 / 相同焦段 / 仅服装变化</p></div>
      </section>

      <section className={`${styles.section} ${styles.pipelineSection}`} id="pipeline">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>02 / TRACEABLE PIPELINE</p><h2>亲手拖一遍<br />六阶段。</h2></div><p>向右拖动时间轴。你看到的不只是最终图，还有每一步留下的真实中间产物。</p></header>
        <div className={styles.pipelineMain}>
          <div className={styles.stageViewer}><div className={styles.stageImage}><img key={currentStage.src} src={currentStage.src} alt={`${currentStage.name}阶段输出`} /><span>{currentStage.id}_{currentStage.en.toLowerCase()}.webp</span></div><div className={styles.stageDetail}><div><span>STAGE {currentStage.id}</span><em>{currentStage.runner}</em></div><h3>{currentStage.name}</h3><dl><div><dt>INPUT</dt><dd>{currentStage.input}</dd></div><div><dt>OUTPUT</dt><dd>{currentStage.output}</dd></div><div><dt>TIME</dt><dd>{currentStage.time}</dd></div></dl><button>从此阶段重跑 ↗</button></div></div>
          <div className={styles.scrubber}><input aria-label="拖动回看六个处理阶段" type="range" min="0" max="5" step="1" value={stage} onChange={(event) => setStage(Number(event.target.value))} /><div className={styles.scrubberLine}><i style={{ width: `${(stage / 5) * 100}%` }} /></div><div className={styles.stageTabs}>{stages.map((item, index) => <button onClick={() => setStage(index)} className={index === stage ? styles.stageActive : index < stage ? styles.stageDone : ""} key={item.id}><img src={item.src} alt="" /><span>{item.id}</span><b>{item.name}</b><small>{item.time}</small></button>)}</div></div>
        </div>
      </section>

      <section className={styles.section} id="compare">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>03 / BEFORE — AFTER</p><h2>改了什么，<br />没改什么。</h2></div><p>三组滑块分别验证肤色、服装与场景。拖动分界线，变化应该只出现在它该出现的地方。</p></header>
        <div className={styles.compareGrid}><CompareCard before={`${ASSET}/pipeline/01-input-v4.webp`} after={`${ASSET}/pipeline/04-beauty-v4.webp`} title="自然美颜" note="保留五官与皮肤纹理" initial={44} /><CompareCard before={`${ASSET}/pipeline/04-beauty-v4.webp`} after={`${ASSET}/pipeline/05-dressed-v5.webp`} title="快速换装" note="姿态、发型与脸不变" initial={58} /><CompareCard before={`${ASSET}/pipeline/05-dressed-v5.webp`} after={`${ASSET}/pipeline/06-final-v4.webp`} title="智能换景" note="环境光与接触阴影重算" initial={50} /></div>
      </section>

      <section className={`${styles.section} ${styles.identitySection}`} id="identity">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>04 / IDENTITY LOCK</p><h2>还是<br />同一个人。</h2></div><p>把脸拉近以后，眼角、鼻翼、嘴角与下颌落在同一组 68 个关键点上。身份锁的是几何，不是观感。</p></header>
        <div className={styles.identityBoard}><LandmarkPortrait src={identityFaces.before} label="BEFORE" points={identityLandmarks.before} /><div className={styles.identityScore}><span>IDENTITY<br />SIMILARITY</span><b>99.2<sup>%</sup></b><i /><p>FACE GEOMETRY LOCKED</p></div><LandmarkPortrait src={identityFaces.after} label="AFTER" points={identityLandmarks.after} /></div>
      </section>

      <section className={`${styles.section} ${styles.uiSection}`} id="interface">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>05 / THE WORKBENCH</p><h2>四种模式，<br />一个工作台。</h2></div><p>换装、视频换装、实时换装与批量处理共用同一台。换装模式按抠图、身体分析、美颜、换装、换背景推进；下面停在换背景这一步。</p></header>
        <div className={styles.screenFrame}><WorkbenchPreview /></div>
      </section>

      <section className={`${styles.section} ${styles.liveSection}`} id="live">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>06 / LIVE MODE</p><h2>换装，<br />跟得上动作。</h2></div><p>切换造型时保留播放进度。动态示例用于观察转身、抬手和衣摆跟随，而不是挑一帧最好看的静态结果。</p></header>
        <div className={styles.liveDemo}><div className={styles.liveViewport}><div className={styles.liveVideoStack}>{liveLooks.map((item, index) => <video ref={(node) => { videoRefs.current[index] = node; }} className={index === liveLook ? styles.liveVideoActive : ""} key={item.src} autoPlay muted loop playsInline preload="auto" src={item.src} />)}</div><div className={styles.liveHud}><span><i />LIVE</span><b>24 FPS</b><em>82 ms</em></div><button className={styles.playButton} onClick={() => setPlaying((value) => !value)} aria-label={playing ? "暂停视频" : "播放视频"}>{playing ? "Ⅱ" : "▶"}</button></div><div className={styles.liveControl}><div><span>CAMERA</span><b>内置摄像头</b></div><div className={styles.liveChoices}>{liveLooks.map((item, index) => <button className={index === liveLook ? styles.liveChoiceActive : ""} onClick={() => setLiveLook(index)} key={item.name}>{item.name}</button>)}</div><div className={styles.liveActions}><button>● 录制</button><button>截帧 ↗</button></div></div></div>
      </section>

      <section className={`${styles.section} ${styles.archSection}`} id="architecture">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>07 / UNDER THE HOOD</p><h2>换装走五步，<br />背景不等待。</h2></div><p>抠图、身体分析、美颜在本地先做完。换装上云的同时，换背景已经开工——两段耗时重叠，而不是首尾相加。</p></header>
        <div className={styles.archLanes}>
          <article>
            <span>LOCAL · 1.1s + 1.4s + 0.9s</span>
            <b>本地视觉</b>
            <p>可控、可复现、不把原图送出机器。</p>
            <ul>
              <li><em>01</em>抠图</li>
              <li><em>02</em>身体分析</li>
              <li><em>03</em>美颜</li>
            </ul>
          </article>
          <i>并行 →</i>
          <article className={styles.archCore}>
            <span>CLOUD · 9.8s ∥ 3.1s</span>
            <b>云端生成</b>
            <p>只处理生成任务，供应商可替换。</p>
            <ul>
              <li><em>04</em>换装</li>
              <li><em>05</em>换背景<span>不排队</span></li>
            </ul>
          </article>
        </div>
        <div className={styles.gantt}><div className={styles.ganttAxis}><span>0s</span><span>2s</span><span>4s</span><span>6s</span><span>8s</span><span>10s</span><span>12s</span></div>{[{n:"抠图",s:0,w:10},{n:"身体分析",s:0,w:13},{n:"美颜",s:10,w:8},{n:"换装",s:18,w:73},{n:"换背景",s:46,w:26}].map((row) => <div className={styles.ganttRow} key={row.n}><b>{row.n}</b><div><i style={{ left: `${row.s}%`, width: `${row.w}%` }} /><span style={{ left: `${row.s + row.w}%` }}>{row.n === "换背景" ? "并行 · 零等待" : ""}</span></div></div>)}</div>
      </section>

      <section className={`${styles.section} ${styles.limitSection}`} id="limits">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>08 / FAILURE ARCHIVE</p><h2>边界输入，<br />会怎样传到结果。</h2></div><p>同一个人、同一条任务链。拖动每张卡片：左边是进入系统的原图，右边是边界条件被放大后的输出。</p></header>
        <div className={styles.failureGrid}>{failures.map((item) => <article key={item.id}><FailureCompare before={item.before} after={item.after} label={item.name} /><header><small>{item.id}</small><em>{item.en}</em></header><h3>{item.name}</h3><p>{item.reason}</p></article>)}</div>
      </section>

    </main>
  </div>;
}
