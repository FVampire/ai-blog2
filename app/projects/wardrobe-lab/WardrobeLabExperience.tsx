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

const faceLandmarks: ReadonlyArray<readonly [number, number]> = [
  [22, 43], [23, 49], [25, 55], [28, 61], [32, 66], [37, 70], [43, 73], [49, 75], [55, 76], [61, 75], [67, 73], [73, 69], [78, 65], [82, 59], [85, 53], [87, 47], [88, 41],
  [32, 37], [37, 34], [42, 34], [46, 36], [49, 38], [56, 38], [60, 36], [65, 35], [70, 36], [74, 38],
  [53, 41], [53, 46], [53, 51], [53, 55], [47, 57], [50, 59], [53, 60], [56, 59], [59, 57],
  [34, 42], [38, 40], [43, 41], [46, 43], [42, 44], [38, 44], [59, 43], [63, 41], [68, 41], [72, 43], [68, 45], [63, 45],
  [42, 63], [46, 61], [50, 61], [53, 62], [56, 61], [60, 62], [64, 65], [60, 68], [56, 70], [52, 70], [47, 68], [44, 66],
  [47, 65], [50, 64], [53, 64], [57, 64], [60, 65], [57, 67], [53, 67], [50, 67],
] as const;

function CompareCard({ before, after, title, note, initial = 50 }: { before: string; after: string; title: string; note: string; initial?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <article className={styles.compareCard}>
      <div className={styles.compareFrame}>
        <img src={after} alt={`${title}处理后`} />
        <div className={styles.compareAfter} style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
          <img src={before} alt={`${title}处理前`} />
        </div>
        <div className={styles.compareLine} style={{ left: `${value}%` }}><span>↔</span></div>
        <span className={styles.beforeLabel}>原图</span>
        <span className={styles.afterLabel}>结果</span>
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

function LandmarkPortrait({ src, label }: { src: string; label: string }) {
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
      const faceBox = {
        x: offsetX + renderedWidth * 0.445,
        y: offsetY + renderedHeight * 0.143,
        width: renderedWidth * 0.11,
        height: renderedHeight * 0.08,
      };
      const bounds = { left: 22, right: 88, top: 34, bottom: 76 };
      const point = ([x, y]: readonly [number, number]) => [
        faceBox.x + ((x - bounds.left) / (bounds.right - bounds.left)) * faceBox.width,
        faceBox.y + ((y - bounds.top) / (bounds.bottom - bounds.top)) * faceBox.height,
      ] as const;

      context.strokeStyle = "rgba(217, 161, 91, 0.9)";
      context.fillStyle = "#f2f0ec";
      context.lineWidth = 1.2;
      const drawGroup = (start: number, end: number, close = false) => {
        context.beginPath();
        faceLandmarks.slice(start, end + 1).forEach((landmark, index) => {
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
      faceLandmarks.forEach((landmark) => {
        const [x, y] = point(landmark);
        context.beginPath();
        context.arc(x, y, 2.3, 0, Math.PI * 2);
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
  }, []);

  return <figure className={styles.landmarkPortrait}>
    <img ref={imageRef} src={src} alt={`${label}的人脸关键点`} loading="lazy" />
    <canvas ref={canvasRef} aria-hidden="true" />
    <figcaption>{label} · LANDMARKS 68</figcaption>
  </figure>;
}

const capabilities = [
  ["虚拟换装", "单件、组合与参考图", "ACTIVE"],
  ["阶段回看", "任一步骤重跑与比对", "6 STEPS"],
  ["实时换装", "摄像头输入与动作跟随", "24 FPS"],
  ["批量处理", "队列、命名与分层导出", "8 JOBS"],
] as const;

function WorkbenchPreview() {
  return <div className={styles.capabilityWorkbench}>
    <div className={styles.mockTop}><b>WARDROBE LAB</b><span>四种能力 · 当前：虚拟换装</span><em>READY</em></div>
    <aside className={styles.capabilityNav}>
      <b>工作空间</b>
      {capabilities.map(([name], index) => <button className={index === 0 ? styles.capabilityActive : ""} key={name}><span>{String(index + 1).padStart(2, "0")}</span>{name}</button>)}
    </aside>
    <div className={styles.capabilityCanvas}>
      <header><div><span>当前任务</span><b>人物换装 · 午后公寓</b></div><em>job #A7F2</em></header>
      <div className={styles.capabilityStage}>
        <img src={`${ASSET}/pipeline/06-final-v4.webp`} alt="完整展示的驼色大衣换装结果" />
        <div><span>IDENTITY LOCKED</span><span>GARMENT ONLY</span><span>FULL BODY</span></div>
      </div>
      <footer><button>导出 PNG</button><button>导出图层</button><button>生成交付包</button></footer>
    </div>
    <aside className={styles.capabilityInspector}>
      <span>四种能力</span>
      <div className={styles.capabilityList}>{capabilities.map(([name, detail, meta]) => <article key={name}><div><b>{name}</b><small>{detail}</small></div><em>{meta}</em></article>)}</div>
      <div className={styles.queueStatus}><span>任务状态</span><b>6 / 6 完成</b><i><u /></i><small>结果、日志与中间产物已保存</small></div>
    </aside>
  </div>;
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
        <div className={styles.heroImage}><img src={`${ASSET}/pipeline/hero-v4.webp`} alt="身穿驼色大衣站在午后公寓中的人物" /><span>FINAL / 06</span></div>
        <div className={styles.heroCopy}><p className={styles.kicker}>00 / VIRTUAL WARDROBE SYSTEM</p><h1><span>只换衣服。</span><span><em>不换你。</em></span></h1><p>从输入到成片，每一步都留下可回看的证据。不是一次黑盒调用，而是一条可解释、可重跑、可交付的视觉流水线。</p><a href="#pipeline">亲手拖一遍六阶段 <span>↓</span></a></div>
        <div className={styles.heroMeta}><span>IMAGE / LIVE</span><span>6-STAGE PIPELINE</span><span>LOCAL-FIRST</span></div>
      </section>

      <section className={styles.section} id="looks">
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
        <header className={styles.sectionHead}><div><p className={styles.kicker}>04 / IDENTITY LOCK</p><h2>还是<br />同一个人。</h2></div><p>对齐眼角、鼻翼、嘴角与下颌关键点。身份不是凭感觉，而是流水线里的硬约束。</p></header>
        <div className={styles.identityBoard}><LandmarkPortrait src={`${ASSET}/pipeline/identity-before-v4.webp`} label="BEFORE" /><div className={styles.identityScore}><span>IDENTITY<br />SIMILARITY</span><b>99.2<sup>%</sup></b><i /><p>FACE GEOMETRY LOCKED</p></div><LandmarkPortrait src={`${ASSET}/pipeline/identity-after-v4.webp`} label="AFTER" /></div>
      </section>

      <section className={`${styles.section} ${styles.uiSection}`} id="interface">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>05 / THE WORKBENCH</p><h2>四种模式，<br />一个工作台。</h2></div><p>图像、阶段、实时与批量不是四个孤立页面，而是同一任务在不同尺度下的视图。</p></header>
        <div className={styles.screenFrame}><WorkbenchPreview /></div>
      </section>

      <section className={`${styles.section} ${styles.liveSection}`} id="live">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>06 / LIVE MODE</p><h2>换装，<br />跟得上动作。</h2></div><p>切换造型时保留播放进度。动态示例用于观察转身、抬手和衣摆跟随，而不是挑一帧最好看的静态结果。</p></header>
        <div className={styles.liveDemo}><div className={styles.liveViewport}><div className={styles.liveVideoStack}>{liveLooks.map((item, index) => <video ref={(node) => { videoRefs.current[index] = node; }} className={index === liveLook ? styles.liveVideoActive : ""} key={item.src} autoPlay muted loop playsInline preload="auto" src={item.src} />)}</div><div className={styles.liveHud}><span><i />LIVE</span><b>24 FPS</b><em>82 ms</em></div><button className={styles.playButton} onClick={() => setPlaying((value) => !value)} aria-label={playing ? "暂停视频" : "播放视频"}>{playing ? "Ⅱ" : "▶"}</button></div><div className={styles.liveControl}><div><span>CAMERA</span><b>内置摄像头</b></div><div className={styles.liveChoices}>{liveLooks.map((item, index) => <button className={index === liveLook ? styles.liveChoiceActive : ""} onClick={() => setLiveLook(index)} key={item.name}>{item.name}</button>)}</div><div className={styles.liveActions}><button>● 录制</button><button>截帧 ↗</button></div></div></div>
      </section>

      <section className={`${styles.section} ${styles.archSection}`} id="architecture">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>07 / UNDER THE HOOD</p><h2>不是一次<br />API 调用。</h2></div><p>本地视觉侧车负责可控步骤，云端适配层只处理生成任务。背景藏在换装耗时后面并行完成。</p></header>
        <div className={styles.archFlow}><article><span>CLIENT</span><b>浏览器</b><small>IMAGE / LIVE / BATCH</small></article><i>WS / HTTP →</i><article className={styles.archCore}><span>ORCHESTRATOR</span><b>Node BFF</b><small>密钥边界 · JOB 目录 · 重试</small></article><i>→</i><div><article><span>LOCAL</span><b>Python Vision Sidecar</b><small>ONNX 会话复用</small></article><article><span>CLOUD</span><b>生成适配层</b><small>换装 / 背景 · 可换供应商</small></article></div></div>
        <div className={styles.gantt}><div className={styles.ganttAxis}><span>0s</span><span>2s</span><span>4s</span><span>6s</span><span>8s</span><span>10s</span><span>12s</span></div>{[{n:"抠图",s:0,w:10},{n:"解析",s:0,w:13},{n:"美颜",s:10,w:8},{n:"换装",s:18,w:73},{n:"背景",s:46,w:26},{n:"合成",s:91,w:7}].map((row) => <div className={styles.ganttRow} key={row.n}><b>{row.n}</b><div><i style={{ left: `${row.s}%`, width: `${row.w}%` }} /><span style={{ left: `${row.s + row.w}%` }}>{row.n === "背景" ? "并行 · 零等待" : ""}</span></div></div>)}</div>
      </section>

      <section className={`${styles.section} ${styles.limitSection}`} id="limits">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>08 / FAILURE ARCHIVE</p><h2>边界输入，<br />会怎样传到结果。</h2></div><p>同一个人、同一条任务链。拖动每张卡片：左边是进入系统的原图，右边是边界条件被放大后的输出。</p></header>
        <div className={styles.failureGrid}>{failures.map((item) => <article key={item.id}><FailureCompare before={item.before} after={item.after} label={item.name} /><header><small>{item.id}</small><em>{item.en}</em></header><h3>{item.name}</h3><p>{item.reason}</p></article>)}</div>
      </section>

    </main>
  </div>;
}
