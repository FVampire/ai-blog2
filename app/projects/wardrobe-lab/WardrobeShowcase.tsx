"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { looks, stages, motionLooks, motionPath } from "./presentation-data";
import s from "./studio.module.css";

function Compare({ before, after }: { before: string; after: string }) {
  const [split, setSplit] = useState(38);
  return (
    <div className={s.compare}>
      <img src={after} alt="换装结果" />
      <img
        src={before}
        alt="原始人物"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      />
      <span className={s.compareHandle} style={{ left: `${split}%` }}>
        <b>↔</b>
      </span>
      <span className={s.before}>BEFORE</span>
      <span className={s.after}>AFTER</span>
      <input
        aria-label="拖动对比原图与成片"
        type="range"
        min="0"
        max="100"
        value={split}
        onChange={(e) => setSplit(+e.target.value)}
      />
    </div>
  );
}

function Motion({ live = false }: { live?: boolean }) {
  const [active, setActive] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const position = useRef(0);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (playing && visible) void video.current?.play().catch(() => {});
    else video.current?.pause();
  }, [playing, visible, active]);
  const capture = () => {
    if (!video.current || video.current.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.current.videoWidth;
    canvas.height = video.current.videoHeight;
    canvas.getContext("2d")?.drawImage(video.current, 0, 0);
    const link = document.createElement("a");
    link.download = "wardrobe-frame.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  return (
    <div ref={container} className={s.motion}>
      <div className={s.motionScreen}>
        <video
          ref={video}
          src={visible ? motionPath(motionLooks[active].id) : undefined}
          poster={motionPath(motionLooks[active].id, "jpg")}
          muted
          playsInline
          loop
          preload="metadata"
          onLoadedMetadata={() => {
            if (video.current) {
              video.current.currentTime =
                position.current % (video.current.duration || 1);
              if (playing && visible) void video.current.play().catch(() => {});
            }
          }}
          onTimeUpdate={() => {
            if (video.current)
              setProgress(
                (video.current.currentTime / (video.current.duration || 1)) *
                  100,
              );
          }}
          onError={() => setFailed(true)}
        />
        <div className={s.motionHud}>
          <span>
            <i /> {live ? "LIVE SESSION" : "MOTION STUDIO"}
          </span>
          <span>IDENTITY LOCK ON</span>
        </div>
        <div className={s.motionBottom}>
          <b>
            {motionLooks[active].name}
            <small> / MOTION COLLECTION</small>
          </b>
          <button
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? "暂停视频" : "播放视频"}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
        </div>
        {failed && <p className={s.videoError}>视频加载失败，请切换造型重试</p>}
      </div>
      <div className={s.videoProgress}>
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className={s.motionControls}>
        <div>
          {motionLooks.map((look, index) => (
            <button
              key={look.id}
              aria-pressed={active === index}
              onClick={() => {
                position.current = video.current?.currentTime || 0;
                setFailed(false);
                setActive(index);
              }}
            >
              <img src={motionPath(look.id, "jpg")} alt="" loading="lazy" />
              <span>{look.name}</span>
            </button>
          ))}
        </div>
        <button className={s.outlineButton} onClick={capture}>
          截取画面 ↗
        </button>
      </div>
    </div>
  );
}

function Studio() {
  const [mode, setMode] = useState(0);
  const [look, setLook] = useState(1);
  const [light, setLight] = useState(50);
  const [compare, setCompare] = useState(false);
  const [status, setStatus] = useState("全部更改已保存");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modes = ["图像换装", "视频换装", "实时换装", "批量处理"];
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const run = () => {
    // TODO(replace): Subscribe to actual job progress and persist generated output IDs.
    setBusy(true);
    setStatus("正在解析人物与服装…");
    timer.current = setTimeout(() => {
      setBusy(false);
      setStatus(
        mode === 3 ? "7 / 7 成片已就绪" : "成片已就绪 · 已保存至作品集",
      );
    }, 1600);
  };
  return (
    <div className={s.studio}>
      <div className={s.studioBar}>
        <span className={s.windowDots}>● ● ●</span>
        <b>
          WARDROBE <span>STUDIO</span>
        </b>
        <span className={s.projectName}>Untitled collection / 01</span>
        <span className={s.saved}>
          <i /> {status}
        </span>
      </div>
      <div className={s.studioBody}>
        <aside className={s.sidebar}>
          <small>WORKSPACE</small>
          {modes.map((name, index) => (
            <button
              key={name}
              aria-pressed={mode === index}
              onClick={() => setMode(index)}
            >
              <span>{["◇", "▷", "◉", "▦"][index]}</span>
              {name}
              <em>0{index + 1}</em>
            </button>
          ))}
          <div className={s.sidebarNote}>
            <span>✦</span>
            <b>你的创作，保持一致。</b>
            <p>
              同一人物、同一工作流。
              <br />
              从一张图到整个系列。
            </p>
          </div>
          <div className={s.storage}>
            <span>
              项目素材 <b>8 / 24</b>
            </span>
            <i />
          </div>
        </aside>
        <div className={s.editor}>
          <div className={s.editorBar}>
            <span>
              {modes[mode]} <em>/ COLLECTION 01</em>
            </span>
            {mode === 0 && (
              <button
                aria-pressed={compare}
                onClick={() => setCompare(!compare)}
              >
                {compare ? "单图视图" : "◫ 原图对比"}
              </button>
            )}
            {mode === 3 && <span>7 ITEMS</span>}
          </div>
          {mode === 0 ? (
            <div
              className={s.editorCanvas}
              style={{ filter: `brightness(${0.85 + light * 0.003})` }}
            >
              {compare ? (
                <Compare before={looks[0].image} after={looks[look].image} />
              ) : (
                <img src={looks[look].image} alt={looks[look].name} />
              )}
              <span className={s.canvasTag}>01 / {looks[look].tag}</span>
              {busy && (
                <div className={s.processing}>
                  <i />
                  <span>正在构建光影与面料细节</span>
                </div>
              )}
            </div>
          ) : mode === 3 ? (
            <div className={s.batchGrid}>
              {looks.slice(1).map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setLook(index + 1);
                    setMode(0);
                  }}
                >
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <span>
                    {item.name}
                    <b>{busy ? "处理中" : "✓ READY"}</b>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Motion key={mode} live={mode === 2} />
          )}
          <div className={s.editorFooter}>
            <span>
              <i /> {busy ? "PROCESSING" : "ALL SYSTEMS READY"}
            </span>
            <span>
              身份保持 <b>ON</b> · 高质量输出 <b>ON</b>
            </span>
            <span>FIT ↗</span>
          </div>
        </div>
        <aside className={s.inspector}>
          <small>CREATIVE DIRECTION</small>
          <h3>{mode === 3 ? "系列成片" : "造型与质感"}</h3>
          <p>选择服装，余下的交给光影。</p>
          <label className={s.fieldLabel}>
            服装库 <span>07 LOOKS</span>
          </label>
          <div className={s.inspectorLooks}>
            {looks.slice(1).map((item, index) => (
              <button
                key={item.name}
                aria-label={item.name}
                aria-pressed={look === index + 1}
                onClick={() => {
                  setLook(index + 1);
                  setStatus(`已选择${item.name}`);
                }}
              >
                <img src={item.image} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className={s.selectedName}>
            {looks[look].name}
            <span>SELECTED</span>
          </div>
          <label className={s.lightControl}>
            环境光 <output>{light}%</output>
            <input
              aria-label="环境光"
              type="range"
              value={light}
              onChange={(e) => setLight(+e.target.value)}
            />
          </label>
          <div className={s.lockCard}>
            <span>◎</span>
            <div>
              <b>身份锁定</b>
              <small>面部 · 姿态 · 人物比例</small>
            </div>
            <i />
          </div>
          <div className={s.outputSettings}>
            <span>
              输出格式<b>WEBP</b>
            </span>
            <span>
              画质<b>HIGH</b>
            </span>
          </div>
          <button className={s.primaryButton} disabled={busy} onClick={run}>
            {busy ? "正在生成…" : mode === 3 ? "生成整个系列 ↗" : "生成成片 ↗"}
          </button>
          <a className={s.download} href={looks[look].image} download>
            下载当前成片 ↓
          </a>
        </aside>
      </div>
      <div className={s.srOnly} role="status">
        {status}
      </div>
    </div>
  );
}

export default function WardrobeShowcase() {
  const [look, setLook] = useState(1);
  const [stage, setStage] = useState(4);
  return (
    <div className={s.page}>
      <header className={s.header}>
        <Link href="/projects" className={s.brand}>
          <span>
            W<span>↗</span>
          </span>
          WARDROBE LAB<small>VISUAL SYSTEM</small>
        </Link>
        <nav>
          <a href="#collection">造型系列</a>
          <a href="#studio">创作工作台</a>
          <a href="#pipeline">技术内核</a>
          <a href="#motion">动态换装</a>
        </nav>
        <a className={s.headerCta} href="#studio">
          进入工作台 ↗
        </a>
      </header>
      <main>
        <section className={s.hero}>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>
              <i /> THE NEXT WAY TO GET DRESSED
            </p>
            <h1>
              万千造型。
              <br />
              始终是<em>你。</em>
            </h1>
            <p className={s.heroDescription}>
              把每一个风格想象，穿成真实。
              <br />
              从一张照片，到一整个动态衣橱。
            </p>
            <div className={s.heroActions}>
              <a className={s.primaryButton} href="#studio">
                开启创作 ↗
              </a>
              <a href="#motion">▷ 观看动态效果</a>
            </div>
            <div className={s.heroFoot}>
              <span>01 — 07</span>
              <p>
                一张原图 · 无限表达
                <br />
                <small>IDENTITY FIRST. POSSIBILITY ALWAYS.</small>
              </p>
            </div>
          </div>
          <div className={s.heroArt}>
            <div className={s.heroArtTop}>
              <span>COLLECTION / 001</span>
              <span>✦ IDENTITY PRESERVED</span>
            </div>
            <img
              key={look}
              className={s.heroPortrait}
              src={looks[look].image}
              alt={looks[look].name}
              fetchPriority="high"
            />
            <div className={s.sourceCard}>
              <img src={looks[0].image} alt="人物原图" />
              <span>↗ SOURCE IMAGE</span>
            </div>
            <div className={s.heroCaption}>
              <div>
                <small>{looks[look].tag}</small>
                <h2>{looks[look].name}</h2>
              </div>
              <span>
                0{look}
                <small> / 07</small>
              </span>
            </div>
            <div className={s.heroPicker}>
              {looks.slice(1).map((item, index) => (
                <button
                  key={item.name}
                  aria-label={`首屏切换${item.name}`}
                  aria-pressed={look === index + 1}
                  onClick={() => setLook(index + 1)}
                >
                  <img src={item.image} alt="" />
                  <span>0{index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
        <div className={s.capabilities}>
          <span>ONE PERSON. EVERY POSSIBILITY.</span>
          <b>IMAGE TRY-ON</b>
          <i>✦</i>
          <b>MOTION TRANSFER</b>
          <i>✦</i>
          <b>IDENTITY LOCK</b>
          <i>✦</i>
          <b>BATCH STUDIO</b>
        </div>
        <section className={s.section} id="collection">
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>01 / THE COLLECTION</p>
              <h2>
                风格变了。
                <br />
                <em>你，一眼可认。</em>
              </h2>
            </div>
            <p>
              剪裁、材质、光影，都可以重新想象。
              <br />
              让人物始终留在画面的中心。
            </p>
          </div>
          <div className={s.collection}>
            {looks.slice(1, 5).map((item, index) => (
              <button
                key={item.name}
                onClick={() => {
                  setLook(index + 1);
                  document
                    .getElementById("collection-compare")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <div>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <span>↗</span>
                </div>
                <small>LOOK / 0{index + 1}</small>
                <h3>{item.name}</h3>
                <p>{item.tag}</p>
              </button>
            ))}
          </div>
          <div id="collection-compare" className={s.detailCompare}>
            <Compare before={looks[0].image} after={looks[look].image} />
            <div>
              <p className={s.eyebrow}>SAME PERSON. NEW EXPRESSION.</p>
              <h3>
                细节经得起
                <br />
                拉近看。
              </h3>
              <p>
                拖动分界线，观察面部、姿态与服装之间的变化。每一个新造型，都从同一个你开始。
              </p>
              <div className={s.identityStrip}>
                <img
                  src="/projects/wardrobe-lab/identity-before.webp"
                  alt="原始面部"
                  loading="lazy"
                />
                <span>◎</span>
                <img
                  src="/projects/wardrobe-lab/identity-after.webp"
                  alt="处理后面部"
                  loading="lazy"
                />
              </div>
              <div className={s.identityMetric}>
                <b>
                  99.2<small>%</small>
                </b>
                <span>
                  IDENTITY SIMILARITY
                  <br />
                  人物一致性
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className={`${s.section} ${s.studioSection}`} id="studio">
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>02 / YOUR CREATIVE SPACE</p>
              <h2>
                所有可能，<em>一台完成。</em>
              </h2>
            </div>
            <p>
              图像、视频、实时与批量。
              <br />
              从第一件衣服，创作到整个系列。
            </p>
          </div>
          <Studio />
          <div className={s.studioBenefits}>
            <span>◎ 身份始终锁定</span>
            <span>◫ 每一步可回看</span>
            <span>↗ 高质量成片导出</span>
            <span>▦ 系列化批量创作</span>
          </div>
        </section>
        <section className={s.section} id="pipeline">
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>03 / INTELLIGENCE, IN LAYERS</p>
              <h2>
                每一层，<em>都看得见。</em>
              </h2>
            </div>
            <p>
              从像素到人物，从面料到环境。
              <br />
              六个阶段，把灵感变成可以交付的成片。
            </p>
          </div>
          <div className={s.pipeline}>
            <div className={s.stageImage}>
              <img
                src={stages[stage].image}
                alt={stages[stage].name}
                loading="lazy"
              />
              <span>ARTIFACT / 0{stage + 1}</span>
            </div>
            <div className={s.stageInfo}>
              <span className={s.eyebrow}>THE PROCESS / 0{stage + 1}</span>
              <h3>{stages[stage].name}</h3>
              <p>{stages[stage].detail}</p>
              <div className={s.stageMetrics}>
                <span>
                  运行环境<b>{stages[stage].engine}</b>
                </span>
                <span>
                  阶段耗时<b>{stages[stage].time}</b>
                </span>
              </div>
              <div className={s.stageButtons}>
                {stages.map((item, index) => (
                  <button
                    key={item.name}
                    aria-pressed={stage === index}
                    onClick={() => setStage(index)}
                  >
                    <span>0{index + 1}</span>
                    {item.name}
                    <i>{stage === index ? "↗" : "✓"}</i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className={`${s.section} ${s.motionSection}`} id="motion">
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>04 / STYLE IN MOTION</p>
              <h2>
                不止一帧。
                <br />
                <em>每一刻都出色。</em>
              </h2>
            </div>
            <p>
              转身、抬手、向前一步。
              <br />
              造型跟随动作，风格无需暂停。
            </p>
          </div>
          <Motion />
          <div className={s.motionNote}>
            <span>CONSISTENT THROUGH EVERY FRAME</span>
            <a
              href="https://decart.ai/lucy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Motion powered by Decart Lucy ↗
            </a>
          </div>
        </section>
        <section className={`${s.section} ${s.architecture}`}>
          <p className={s.eyebrow}>05 / BUILT FOR THE WHOLE PICTURE</p>
          <h2>
            本地的掌控感。
            <br />
            <em>云端的创造力。</em>
          </h2>
          <div className={s.archGrid}>
            <article>
              <span>01 / LOCAL VISION</span>
              <h3>先理解，再创造。</h3>
              <p>
                抠图、身体解析、自然美颜。精细处理在本地完成，为每次创作建立稳定的人物基准。
              </p>
              <div>INPUT → CUTOUT → PARSING → BEAUTY</div>
            </article>
            <article>
              <span>02 / PARALLEL GENERATION</span>
              <h3>灵感，无需排队。</h3>
              <p>
                服装与场景并行生成。保留中间产物，让创作可调整、可重跑，也可成批交付。
              </p>
              <div>TRY-ON ∥ BACKGROUND → COMPOSITE</div>
            </article>
          </div>
        </section>
        <section className={s.closing}>
          <p className={s.eyebrow}>YOUR NEXT LOOK STARTS HERE</p>
          <h2>
            下一个你，<em>穿什么？</em>
          </h2>
          <a className={s.primaryButton} href="#studio">
            打开你的衣橱 ↗
          </a>
          <div>
            <Link href="/projects">← 探索更多项目</Link>
            <span>WARDROBE LAB / VISUAL SYSTEM</span>
            <a href="#">回到顶部 ↑</a>
          </div>
        </section>
      </main>
    </div>
  );
}
