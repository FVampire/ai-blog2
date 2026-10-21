'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import s from './seam.module.css';

const BASE = '/projects/ai-garment-pattern-agent/studio';

type Shot = { shot: string; title: string; caption: string };
const W = 1240;
const H = 848;

export const SHOTS: Shot[] = [
  { shot: '01', title: '设计中枢', caption: '一句话描述蓝色牛津衬衫，SEAM 拆解出六类部件、十组装配关系，同时给出概念图与可实现性检查。' },
  { shot: '02', title: '组合式制版计划', caption: '从基础原型出发，领座、门襟、袖片与袖克夫按依赖逐步执行，每一步都记录工具与参数。' },
  { shot: '03', title: '纸样工程', caption: '默认排料视图：25 个裁片排进 150 cm 幅宽布料，显示布纹方向与利用率；选中长袖可查看刀口与量线。' },
  { shot: '04', title: '几何与缝长校验', caption: '25 片几何闭合；12 组缝长配对逐项比对 A/B 长度、允许吃势与公差。' },
  { shot: '05', title: '改版 SpecDelta', caption: '“袖长加长 1 cm，保持领型”：袖长 590.9 → 600.9 mm，只影响袖片，领围锁定。' },
  { shot: '06', title: '虚拟试衣', caption: '人台四角度预览，胸围、袖肥、领围松量与关注部位。' },
  { shot: '07', title: '物料与成本', caption: '主料 1.15 m、粘合衬 0.07 m，物料与裁片一一关联，汇总单件成本。' },
  { shot: '08', title: '工艺包', caption: '12 道缝制工序与质检点、9 项成衣尺寸，导出 SVG / PDF / DXF。' },
  { shot: '09', title: '样衣复核', caption: '首件实测与目标对比，定位袖长 −8 mm 的超差并给出下一轮改版建议。' },
  { shot: '10', title: '设置', caption: '模型分工、尺码体系、默认缝份与导出格式。' },
];

const CLIPS = [
  { id: '01-design-understanding', title: '设计理解', copy: '从一句描述到 StyleGraph：部件、层次与装配关系逐项出现，四视图随后生成。' },
  { id: '02-plan-and-pieces', title: '制版与裁片', copy: '制版计划逐步执行，CAD 画布上的 25 个裁片逐片生成。' },
  { id: '03-seam-validation', title: '缝长校验', copy: '几何闭合与 12 组缝长配对逐行校验通过。' },
  { id: '04-spec-delta', title: '改版', copy: '一句话改版，受影响的袖片高亮更新，其余几何保持不变。' },
  { id: '05-tech-pack', title: '工艺包', copy: '工序、质检与尺寸表汇总成可导出的工艺包。' },
] as const;

export function FlowFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <figure className={s.film}>
      <video
        ref={ref}
        src={`${BASE}/video/seam-workflow.mp4`}
        poster={`${BASE}/video/seam-workflow.webp`}
        width={1600}
        height={1000}
        preload="none"
        playsInline
        controls={playing}
        onPlay={() => setPlaying(true)}
      />
      {!playing && (
        <button type="button" className={s.filmPlay} onClick={() => void ref.current?.play()}>
          <span aria-hidden="true">▶</span>
          <b>播放完整流程</b>
          <small>约 100 秒 · 描述 → 设计理解 → 制版 → 校验 → 改版 → 工艺包</small>
        </button>
      )}
    </figure>
  );
}

export function ClipStrip() {
  const [active, setActive] = useState<(typeof CLIPS)[number]['id']>('02-plan-and-pieces');
  const clip = CLIPS.find((c) => c.id === active)!;

  return (
    <div className={s.clips}>
      <div className={s.clipList} role="tablist" aria-label="流程片段">
        {CLIPS.map((c, i) => (
          <button key={c.id} type="button" role="tab" aria-selected={c.id === active} onClick={() => setActive(c.id)}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <b>{c.title}</b>
            <p>{c.copy}</p>
          </button>
        ))}
      </div>
      <figure className={s.clipStage}>
        <video
          key={clip.id}
          src={`${BASE}/video/${clip.id}.mp4`}
          poster={`${BASE}/video/${clip.id}.webp`}
          width={1600}
          height={1000}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`流程片段：${clip.title}`}
        />
      </figure>
    </div>
  );
}

function Lightbox({ shot, onClose, onStep }: { shot: Shot; onClose: () => void; onStep: (d: number) => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = overflow; };
  }, [onClose, onStep]);

  return (
    <div className={s.lightbox} role="dialog" aria-modal="true" aria-label={shot.title} onClick={onClose}>
      <figure onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${BASE}/shots/full/${shot.shot}.webp`} alt={shot.title} />
        <figcaption><b>{shot.title}</b>{shot.caption}<span>← → 切换 · Esc 关闭</span></figcaption>
      </figure>
      <button type="button" className={s.lightboxClose} onClick={onClose} aria-label="关闭">×</button>
    </div>
  );
}

export function FeatureGallery() {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const shot = SHOTS[index];
  const step = (d: number) => setIndex((i) => (i + d + SHOTS.length) % SHOTS.length);

  return (
    <div className={s.featureBody}>
      <ol className={s.featureList}>
        {SHOTS.map((item, i) => (
          <li key={item.shot}>
            <button type="button" aria-current={i === index} onClick={() => setIndex(i)}>
              <b>{item.title}</b>
              <span>{item.caption}</span>
            </button>
          </li>
        ))}
      </ol>
      <figure className={s.featureStage}>
        <button type="button" className={s.featureZoom} onClick={() => setZoom(true)} aria-label={`放大查看：${shot.title}`}>
          <Image key={shot.shot} src={`${BASE}/shots/${shot.shot}.webp`} alt={shot.title} width={W} height={H} sizes="(max-width: 900px) 100vw, 900px" />
          <span>点击查看高清原图 ↗</span>
        </button>
        <figcaption>
          <button type="button" onClick={() => step(-1)} aria-label="上一张">←</button>
          <span><b>{shot.title}</b>{index + 1} / {SHOTS.length}</span>
          <button type="button" onClick={() => step(1)} aria-label="下一张">→</button>
        </figcaption>
      </figure>
      {zoom && <Lightbox shot={shot} onClose={() => setZoom(false)} onStep={step} />}
    </div>
  );
}

export function StudioEmbed() {
  const [started, setStarted] = useState(false);

  return (
    <div className={s.embed}>
      <div className={s.embedBar}>
        <span><i aria-hidden="true" />交付成果 · 可交互研发工作台</span>
        <a href={`${BASE}/app/index.html`} target="_blank" rel="noreferrer">全屏打开 ↗</a>
      </div>
      <div className={s.embedStage}>
        {started ? (
          <iframe src={`${BASE}/app/index.html?embed=1`} title="SEAM 服装研发工作台" loading="lazy" />
        ) : (
          <>
            <Image src={`${BASE}/video/seam-workflow.webp`} alt="SEAM 服装研发工作台" fill sizes="(max-width: 900px) 100vw, 1300px" />
            <div className={s.embedStart}>
              <button type="button" onClick={() => setStarted(true)}>打开研发工作台 <b aria-hidden="true">↗</b></button>
              <small>可运行完整流程，也可逐页查看纸样、校验与工艺包</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
