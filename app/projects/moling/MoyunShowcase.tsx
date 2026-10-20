'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import s from './moyun.module.css';

const BASE = '/projects/moling';

const CLIPS = [
  { id: 'outline', no: '02', title: '章节细纲', copy: '从章节目标出发，按场景节拍写出细纲，每一拍都标注要推进的人物与伏笔。' },
  { id: 'competition', no: '03', title: '多模型竞选', copy: '三个模型并行起笔，按连贯性、人物一致性、伏笔呼应与文风打分，胜出者接续写完整章。' },
  { id: 'writing', no: '04', title: '正文生成', copy: '胜出稿流式写入编辑器，侧栏实时标出引用到的人物与伏笔。' },
  { id: 'memory', no: '06', title: '记忆同步', copy: '生成本章摘要，逐条确认人物、关系与物品的状态变更，伏笔进度随之推进。' },
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
          <small>第 112 章 · 87 秒 · 上下文 → 细纲 → 竞选 → 正文 → 审稿 → 记忆</small>
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
        {CLIPS.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={c.id === active} onClick={() => setActive(c.id)}>
            <span>{c.no}</span>
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
            <Image src={`${BASE}/shots/02-chapter.webp`} alt="墨韵章节工作台" fill sizes="(max-width: 900px) 100vw, 1300px" />
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
