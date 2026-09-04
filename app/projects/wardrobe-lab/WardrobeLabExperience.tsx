"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import styles from "./wardrobe-lab.module.css";

const ASSET = "/uploads/wardrobe-lab";

const looks = [
  { id: "00", name: "原始", en: "SOURCE", src: `${ASSET}/looks/00-source-v2.webp` },
  { id: "01", name: "驼色大衣", en: "COAT", src: `${ASSET}/looks/01-coat-v2.webp` },
  { id: "02", name: "黑色西装", en: "SUIT", src: `${ASSET}/looks/02-suit-v2.webp` },
  { id: "03", name: "银灰夹克", en: "JACKET", src: `${ASSET}/looks/03-jacket-v2.webp` },
  { id: "04", name: "城市街头", en: "STREET", src: `${ASSET}/looks/04-street-v2.webp` },
  { id: "05", name: "西部麂皮", en: "WESTERN", src: `${ASSET}/looks/05-western-v2.webp` },
  { id: "06", name: "未来盔甲", en: "ARMOR", src: `${ASSET}/looks/06-armor-v2.webp` },
  { id: "07", name: "深夜礼服", en: "EVENING", src: `${ASSET}/looks/07-evening-v2.webp` },
] as const;

const stages = [
  { id: "01", name: "输入", en: "INPUT", time: "0.3s", runner: "LOCAL", src: `${ASSET}/pipeline/01-input-v2.webp`, input: "person.webp + garment.webp", output: "00_normalized.webp" },
  { id: "02", name: "抠图", en: "CUTOUT", time: "1.1s", runner: "LOCAL", src: `${ASSET}/pipeline/02-cutout-v2.webp`, input: "00_normalized.webp", output: "01_person_cutout.png" },
  { id: "03", name: "解析", en: "PARSING", time: "1.4s", runner: "ONNX", src: `${ASSET}/pipeline/03-parsing-v2.webp`, input: "00_normalized.webp", output: "02_human_parsing.png" },
  { id: "04", name: "美颜", en: "BEAUTY", time: "0.9s", runner: "LOCAL", src: `${ASSET}/pipeline/04-beauty-v2.webp`, input: "01_cutout + 02_parsing", output: "03_beautified.png" },
  { id: "05", name: "换装", en: "TRY ON", time: "9.8s", runner: "CLOUD", src: `${ASSET}/pipeline/05-dressed-v2.webp`, input: "03_beautified + garment", output: "04_dressed_cutout.png" },
  { id: "06", name: "合成", en: "COMPOSITE", time: "0.7s", runner: "LOCAL", src: `${ASSET}/pipeline/06-final-v2.webp`, input: "04_dressed + 05_background", output: "06_final.png" },
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
  { id: "FAIL_01", name: "光源不足", en: "LOW LIGHT", reason: "左侧原图面部曝光不足；右侧服装正常换上，但眼袋、法令纹和皮肤纹理被补重，人物明显显老。", before: `${ASSET}/failures/01-lowlight-before-v3.webp`, after: `${ASSET}/failures/01-lowlight-after-v3.webp` },
  { id: "FAIL_02", name: "主体与背景近色", en: "LOW CONTRAST", reason: "左侧人物与背景颜色接近；右侧换景后位置保持对齐，但袖边、衣摆和发丝被错误侵蚀，出现局部变形。", before: `${ASSET}/failures/02-lowcontrast-before-v3.webp`, after: `${ASSET}/failures/02-lowcontrast-after-v3.webp` },
  { id: "FAIL_03", name: "像素过低", en: "LOW RES", reason: "左侧整张原图分辨率不足；右侧西装正常生成，但模型重建出的眼位、笑容和脸颊轮廓发生变形。", before: `${ASSET}/failures/03-lowres-before-v3.webp`, after: `${ASSET}/failures/03-lowres-after-v4.webp` },
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
        <img src={before} alt={`${title}处理前`} />
        <div className={styles.compareAfter} style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
          <img src={after} alt={`${title}处理后`} />
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
      <img src={before} alt={`${label}边界输入原图`} loading="lazy" />
      <div className={styles.compareAfter} style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
        <img src={after} alt={`${label}条件下的失败结果`} loading="lazy" />
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(217, 161, 91, 0.76)";
    context.fillStyle = "#f2f0ec";
    context.lineWidth = 1.7;

    const drawGroup = (start: number, end: number, close = false) => {
      context.beginPath();
      faceLandmarks.slice(start, end + 1).forEach(([x, y], index) => {
        const point = [x * 10, y * 10] as const;
        if (index === 0) context.moveTo(...point);
        else context.lineTo(...point);
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

    faceLandmarks.forEach(([x, y]) => {
      context.beginPath();
      context.arc(x * 10, y * 10, 4.2, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });
  }, []);

  return <figure className={styles.landmarkPortrait}>
    <img src={src} alt={`${label}的人脸关键点`} loading="lazy" />
    <canvas ref={canvasRef} width="1000" height="1000" aria-hidden="true" />
    <figcaption>{label} · LANDMARKS 68</figcaption>
  </figure>;
}

function ScreenPreview({ mode, stage, setStage, liveLook, setLiveLook }: { mode: string; stage: number; setStage: (value: number) => void; liveLook: number; setLiveLook: (value: number) => void }) {
  if (mode === "STAGES") {
    return <div className={styles.reviewScreen}>
      <div className={styles.mockTop}><b>阶段回看</b><span>job #A7F2</span><em>14.2s</em></div>
      <div className={styles.reviewRail}>{stages.map((item, index) => <button className={index === stage ? styles.mockActive : ""} key={item.id} onClick={() => setStage(index)}><img src={item.src} alt="" /><span>{item.id} {item.name}</span><small>{item.time}</small></button>)}</div>
      <div className={styles.mockInspector}><div><span>「{stages[stage].id} {stages[stage].name}」 输入</span><b>{stages[stage].input}</b><code>{stages[stage].output}</code></div><div><button>从此阶段重跑</button><button>打开文件夹</button><button>日志</button></div></div>
    </div>;
  }

  if (mode === "LIVE") {
    return <div className={styles.liveMock}>
      <div className={styles.mockTop}><b>WARDROBE LAB</b><span>IMAGE · <strong>LIVE</strong></span><em>24 FPS</em></div>
      <div className={styles.liveMockStage}><video key={liveLooks[liveLook].src} autoPlay muted loop playsInline src={liveLooks[liveLook].src} /></div>
      <div className={styles.liveMockControls}><div>{liveLooks.map((item, index) => <button className={index === liveLook ? styles.mockActive : ""} key={item.name} onClick={() => setLiveLook(index)}>{item.name}</button>)}</div><span>内置摄像头</span><span>延迟 82ms</span><button>录制</button><button>截帧</button></div>
    </div>;
  }

  if (mode === "BATCH") {
    return <div className={styles.batchMock}>
      <div className={styles.mockTop}><b>服装队列 (8)</b><span>进度 8/8</span><em>DONE · 01:04</em></div>
      <div className={styles.batchGrid}>{looks.map((item) => <figure key={item.id}><img src={item.src} alt="" /><figcaption><span>{item.name}</span><small>{item.id}</small></figcaption></figure>)}</div>
      <button className={styles.exportAll}>全部导出 ↗</button>
    </div>;
  }

  return <div className={styles.workbenchMock}>
    <div className={styles.mockTop}><b>WARDROBE LAB</b><span><strong>IMAGE</strong> · LIVE</span><em>job #A7F2</em></div>
    <aside className={styles.mockAssets}><p>素材</p><span>人物</span><img src={looks[0].src} alt="人物素材" /><span>服装</span><img src={looks[1].src} alt="服装素材" /></aside>
    <div className={styles.mockCanvas}><CompareCard before={`${ASSET}/pipeline/01-input-v2.webp`} after={`${ASSET}/pipeline/06-final-v2.webp`} title="" note="" initial={48} /><div><button>导出 PNG</button><button>导出图层</button></div></div>
    <aside className={styles.mockStyle}><p>造型</p><span>服装参考</span><img src={looks[1].src} alt="驼色双排大衣" /><b>驼色双排大衣</b><span>背景</span><label>● 午后公寓</label><span>美颜 · 中</span><button>重新生成</button></aside>
    <div className={styles.mockProgress}>{stages.map((item) => <span key={item.id}>{item.id} {item.name}</span>)}<em>14.2s</em></div>
  </div>;
}

export default function WardrobeLabExperience() {
  const [stage, setStage] = useState(4);
  const [activeLook, setActiveLook] = useState(1);
  const [screen, setScreen] = useState("IMAGE");
  const [liveLook, setLiveLook] = useState(1);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentStage = stages[stage];
  const screenTabs = useMemo(() => ["IMAGE", "STAGES", "LIVE", "BATCH"], []);

  useEffect(() => {
    if (!videoRef.current) return;
    if (playing) void videoRef.current.play();
    else videoRef.current.pause();
  }, [playing, liveLook]);

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
        <div className={styles.heroImage}><img src={`${ASSET}/pipeline/hero.webp`} alt="身穿驼色大衣站在午后公寓中的人物" /><span>FINAL / 06</span></div>
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
        <div className={styles.compareGrid}><CompareCard before={`${ASSET}/pipeline/01-input-v2.webp`} after={`${ASSET}/pipeline/04-beauty-v2.webp`} title="自然美颜" note="保留五官与皮肤纹理" initial={44} /><CompareCard before={`${ASSET}/pipeline/04-beauty-v2.webp`} after={`${ASSET}/pipeline/05-dressed-v2.webp`} title="快速换装" note="姿态、发型与脸不变" initial={58} /><CompareCard before={`${ASSET}/pipeline/05-dressed-v2.webp`} after={`${ASSET}/pipeline/06-final-v2.webp`} title="智能换景" note="环境光与接触阴影重算" initial={50} /></div>
      </section>

      <section className={`${styles.section} ${styles.identitySection}`} id="identity">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>04 / IDENTITY LOCK</p><h2>还是<br />同一个人。</h2></div><p>对齐眼角、鼻翼、嘴角与下颌关键点。身份不是凭感觉，而是流水线里的硬约束。</p></header>
        <div className={styles.identityBoard}><LandmarkPortrait src={`${ASSET}/pipeline/identity-before-v2.webp`} label="BEFORE" /><div className={styles.identityScore}><span>IDENTITY<br />SIMILARITY</span><b>99.2<sup>%</sup></b><i /><p>FACE GEOMETRY LOCKED</p></div><LandmarkPortrait src={`${ASSET}/pipeline/identity-after-v2.webp`} label="AFTER" /></div>
      </section>

      <section className={`${styles.section} ${styles.uiSection}`} id="interface">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>05 / THE WORKBENCH</p><h2>四种模式，<br />一个工作台。</h2></div><p>图像、阶段、实时与批量不是四个孤立页面，而是同一任务在不同尺度下的视图。</p></header>
        <div className={styles.screenTabs}>{screenTabs.map((item) => <button className={screen === item ? styles.screenActive : ""} onClick={() => setScreen(item)} key={item}><span>{item === "STAGES" ? "阶段" : item === "BATCH" ? "批量" : item}</span><small>{item === "IMAGE" ? "A" : item === "STAGES" ? "B" : item === "LIVE" ? "C" : "D"}</small></button>)}</div>
        <div className={styles.screenFrame}><ScreenPreview mode={screen} stage={stage} setStage={setStage} liveLook={liveLook} setLiveLook={setLiveLook} /></div>
      </section>

      <section className={`${styles.section} ${styles.liveSection}`} id="live">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>06 / LIVE MODE</p><h2>换装，<br />跟得上动作。</h2></div><p>切换造型时保留播放进度。动态示例用于观察转身、抬手和衣摆跟随，而不是挑一帧最好看的静态结果。</p></header>
        <div className={styles.liveDemo}><div className={styles.liveViewport}><video ref={videoRef} key={liveLooks[liveLook].src} autoPlay muted loop playsInline src={liveLooks[liveLook].src} /><div className={styles.liveHud}><span><i />LIVE</span><b>24 FPS</b><em>82 ms</em></div><button className={styles.playButton} onClick={() => setPlaying((value) => !value)} aria-label={playing ? "暂停视频" : "播放视频"}>{playing ? "Ⅱ" : "▶"}</button></div><div className={styles.liveControl}><div><span>CAMERA</span><b>内置摄像头</b></div><div className={styles.liveChoices}>{liveLooks.map((item, index) => <button className={index === liveLook ? styles.liveChoiceActive : ""} onClick={() => setLiveLook(index)} key={item.name}>{item.name}</button>)}</div><div className={styles.liveActions}><button>● 录制</button><button>截帧 ↗</button></div></div></div>
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

      <section className={styles.closing} id="closing"><p className={styles.kicker}>09 / WARDROBE LAB</p><h2>让变化被看见，<br /><em>也让不变被证明。</em></h2><div><span>IMAGE · LIVE · BATCH</span><a href="#hero">回到顶部 ↑</a></div></section>
    </main>
  </div>;
}
