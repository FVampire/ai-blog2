'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { GROUPS, type Shot } from './gallery-data';
import s from './moyun.module.css';

const BASE = '/projects/moling';

const CLIPS = [
  { id: 'onboarding', title: '新建作品', copy: '聊几轮、点几个选项，作品蓝图逐步成形，生成可编辑的定盘提案。' },
  { id: 'outline', title: '章节规划', copy: '读约束、定人物、排节拍、安排伏笔、一致性预检，再确认细纲。' },
  { id: 'competition', title: '多模型竞选', copy: '三个模型各自起笔，速度、长度各不相同；全部写完后逐项评审，胜出者接续全章。' },
  { id: 'writing', title: '正文生成', copy: '胜出稿流式写入编辑器，侧栏实时标出引用到的人物与伏笔。' },
  { id: 'memory', title: '记忆同步', copy: '生成本章摘要，逐条确认人物、关系与物品的状态变更，伏笔进度随之推进。' },
  { id: 'snapshots', title: '角色回溯', copy: '沿 111 章时间轴拖动，任选两章对比角色状态的变化与来源。' },
] as const;

export function FlowFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <figure className={s.film}>
      <video
        ref={ref}
        src={`${BASE}/video/moyun-flow.mp4`}
        poster={`${BASE}/video/moyun-flow-poster.webp`}
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
          <small>第 112 章 · 约 110 秒 · 上下文 → 规划 → 竞选 → 正文 → 审稿 → 记忆</small>
        </button>
      )}
    </figure>
  );
}

export function ClipStrip() {
  const [active, setActive] = useState<(typeof CLIPS)[number]['id']>('competition');
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
          src={`${BASE}/video/clip-${clip.id}.mp4`}
          poster={`${BASE}/video/clip-${clip.id}.webp`}
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
  const [group, setGroup] = useState(GROUPS[0].id);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = GROUPS.find((g) => g.id === group)!;
  const shot = current.shots[index];
  const step = (d: number) => setIndex((i) => (i + d + current.shots.length) % current.shots.length);

  return (
    <div className={s.features}>
      <div className={s.featureTabs} role="tablist" aria-label="功能分组">
        {GROUPS.map((g) => (
          <button key={g.id} type="button" role="tab" aria-selected={g.id === group} onClick={() => { setGroup(g.id); setIndex(0); }}>
            {g.label}<i>{g.shots.length}</i>
          </button>
        ))}
      </div>
      <p className={s.featureIntro}>{current.intro}</p>
      <div className={s.featureBody}>
        <ol className={s.featureList}>
          {current.shots.map((item, i) => (
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
            <Image key={shot.shot} src={`${BASE}/shots/${shot.shot}.webp`} alt={shot.title} width={shot.w} height={shot.h} sizes="(max-width: 900px) 100vw, 900px" />
            <span>点击查看高清原图 ↗</span>
          </button>
          <figcaption>
            <button type="button" onClick={() => step(-1)} aria-label="上一张">←</button>
            <span><b>{shot.title}</b>{index + 1} / {current.shots.length}</span>
            <button type="button" onClick={() => step(1)} aria-label="下一张">→</button>
          </figcaption>
        </figure>
      </div>
      {zoom && <Lightbox shot={shot} onClose={() => setZoom(false)} onStep={step} />}
    </div>
  );
}

export function StudioEmbed() {
  const [started, setStarted] = useState(false);

  return (
    <div className={s.embed}>
      <div className={s.embedBar}>
        <span><i aria-hidden="true" />交付成果 · 可交互工作台</span>
        <a href={`${BASE}/app/index.html`} target="_blank" rel="noreferrer">全屏打开 ↗</a>
      </div>
      <div className={s.embedStage}>
        {started ? (
          <iframe src={`${BASE}/app/index.html?embed=1`} title="墨韵长篇创作工作台" loading="lazy" />
        ) : (
          <>
            <Image src={`${BASE}/video/moyun-flow-poster.webp`} alt="墨韵章节工作台" fill sizes="(max-width: 900px) 100vw, 1300px" />
            <div className={s.embedStart}>
              <button type="button" onClick={() => setStarted(true)}>亲手写第 112 章 <b aria-hidden="true">↗</b></button>
              <small>可暂停、倍速、跳到任意步骤</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
