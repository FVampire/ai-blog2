'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import s from './seam.module.css';
import { projectMedia } from '../media';

const BASE = '/projects/ai-garment-pattern-agent/studio';
const MEDIA = projectMedia(BASE);

type Shot = { shot: string; title: string; caption: string };
const W = 1240;
const H = 771;

export const SHOTS: Shot[] = [
  { shot: '01-screen', title: '设计中枢', caption: '一句话描述蓝色牛津衬衫，SEAM 拆解出六类部件、十组装配关系，同时给出概念图与可实现性检查。' },
  { shot: '02-screen', title: '组合式制版计划', caption: '从基础原型出发，领座、门襟、袖片与袖克夫按依赖逐步执行，每一步都记录工具与参数。' },
  { shot: 'pattern-piece', title: '纸样工程 · 单片', caption: '长袖 1:1 毫米坐标：净样、毛样、缝线、刀口、布纹分层显示，袖肥、袖长、袖山高等标注齐全；右侧实时缝线配对。' },
  { shot: 'pattern-edit', title: '点编辑', caption: '拖动袖山控制点，曲线即时重算，与前后袖窿的配对差值超出公差时立即标红。' },
  { shot: 'pattern-layers', title: '图层管理', caption: '切割线、缝线、转折点、曲线点、布纹、刀口、钻孔、文字等图层可单独开关。' },
  { shot: 'pattern-export', title: 'DXF 导出', caption: '把编辑后的板片导出为 AAMA / ASTM / R2000 DXF，可选图层、尺码与文字编码；也可导出 SVG 与 1:1 PDF。' },
  { shot: 'pattern-marker', title: '排料', caption: '25 个裁片排进 150 cm 幅宽，显示布纹方向与利用率。' },
  { shot: '04-screen', title: '几何与缝长校验', caption: '25 片几何闭合；12 组缝长配对逐项比对 A/B 长度、允许吃势与公差。' },
  { shot: '05-screen', title: '改版 SpecDelta', caption: '“袖长加长 1 cm，保持领型”：袖长 590.9 → 600.9 mm，只影响袖片，领围锁定。' },
  { shot: '06-material', title: '虚拟试衣', caption: '缝合后的衬衫穿在 M 号数字人台上：四个角度、面料物理参数与各部位松量。' },
  { shot: '06-heat', title: '试衣 · 压力热力图', caption: '布料表面压力分布，定位后背袖窿处 3.2 kPa 的轻微拉扯。' },
  { shot: '06-mesh', title: '试衣 · 仿真网格', caption: '布料三角网格，褶皱处网格更密。' },
  { shot: '07-screen', title: '物料与成本', caption: '主料 1.15 m、粘合衬 0.07 m，物料与裁片一一关联，汇总单件成本。' },
  { shot: '08-screen', title: '工艺包', caption: '12 道缝制工序与质检点、9 项成衣尺寸，导出 SVG / PDF / DXF。' },
  { shot: '09-screen', title: '样衣复核', caption: '首件实测与目标对比，定位袖长 −8 mm 的超差并给出下一轮改版建议。' },
  { shot: '10-screen', title: '设置', caption: '模型分工、尺码体系、默认缝份与导出格式。' },
];

const CLIPS = [
  { id: '01-design-understanding', title: '设计理解', copy: '从一句描述到 StyleGraph：部件、层次与装配关系逐项出现，四视图随后生成。' },
  { id: '02-plan-and-pieces', title: '制版与裁片', copy: '制版计划逐步执行，CAD 画布上的 25 个裁片逐片生成。' },
  { id: '03-seam-validation', title: '缝长校验', copy: '几何闭合与 12 组缝长配对逐行校验通过。' },
  { id: '06-dxf-edit', title: 'DXF 编辑与导出', copy: '选中长袖，拖动袖山点，缝长配对实时提示，导出 DXF。' },
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
        src={`${MEDIA}/video-r3/seam-workflow.mp4`}
        poster={`${MEDIA}/video-r3/seam-workflow.webp`}
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
          src={`${MEDIA}/video-r3/${clip.id}.mp4`}
          poster={`${MEDIA}/video-r3/${clip.id}.webp`}
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
        <img src={`${MEDIA}/shots-r5/full/${shot.shot}.webp`} alt={shot.title} />
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
          <Image unoptimized key={shot.shot} src={`${MEDIA}/shots-r5/${shot.shot}.webp`} alt={shot.title} width={W} height={shot.shot === 'pattern-export' ? 774 : H} sizes="(max-width: 900px) 100vw, 900px" />
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
            <Image unoptimized src={`${MEDIA}/video-r3/seam-workflow.webp`} alt="SEAM 服装研发工作台" fill sizes="(max-width: 900px) 100vw, 1300px" />
            <div className={s.embedStart}>
              <button type="button" onClick={() => setStarted(true)}>打开研发工作台 <b aria-hidden="true">↗</b></button>
              <small>可运行完整流程，也可以编辑纸样并导出 DXF</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
