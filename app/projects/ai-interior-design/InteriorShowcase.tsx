'use client';

import { useState } from 'react';

import Image from 'next/image';

import s from './interior.module.css';
import { projectMedia } from '../media';

const BASE = '/projects/ai-interior-design';
const MEDIA = projectMedia(BASE);

const STYLES = [
  { id: 'natural', label: '自然木色', words: '胡桃木 · 鼠尾草绿 · 象牙白' },
  { id: 'cream', label: '奶油极简', words: '浅橡木 · 燕麦布艺 · 浅金' },
  { id: 'urban', label: '都市轻奢', words: '烟熏胡桃 · 炭灰丝绒 · 香槟金' },
] as const;

type StyleId = (typeof STYLES)[number]['id'];

export function StyleCompare() {
  const [left, setLeft] = useState<StyleId>('natural');
  const [right, setRight] = useState<StyleId>('urban');
  const [split, setSplit] = useState(50);
  const [view, setView] = useState<'03-living' | '01-overview'>('03-living');

  return (
    <div className={s.compareBlock}>
      <div className={s.compareControls}>
        <div className={s.segment} role="group" aria-label="对比视角">
          <button type="button" aria-pressed={view === '03-living'} onClick={() => setView('03-living')}>客餐厅</button>
          <button type="button" aria-pressed={view === '01-overview'} onClick={() => setView('01-overview')}>全屋总览</button>
        </div>
        <label>
          左侧
          <select value={left} onChange={(e) => setLeft(e.target.value as StyleId)}>
            {STYLES.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
          </select>
        </label>
        <label>
          右侧
          <select value={right} onChange={(e) => setRight(e.target.value as StyleId)}>
            {STYLES.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
          </select>
        </label>
      </div>
      <div className={s.compare}>
        <Image unoptimized src={`${MEDIA}/renders/${right}/${view}.webp`} alt={`${STYLES.find((x) => x.id === right)?.label}风格效果图`} fill sizes="(max-width: 900px) 100vw, 1200px" />
        <div className={s.compareLeft} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <Image unoptimized src={`${MEDIA}/renders/${left}/${view}.webp`} alt={`${STYLES.find((x) => x.id === left)?.label}风格效果图`} fill sizes="(max-width: 900px) 100vw, 1200px" />
        </div>
        <span className={s.compareHandle} style={{ left: `${split}%` }} aria-hidden="true">↔</span>
        <span className={s.compareTagLeft}>{STYLES.find((x) => x.id === left)?.label}</span>
        <span className={s.compareTagRight}>{STYLES.find((x) => x.id === right)?.label}</span>
        <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} aria-label="拖动对比两种风格" />
      </div>
      <div className={s.moodboards}>
        {STYLES.map((style) => (
          <figure key={style.id}>
            <Image unoptimized src={`${MEDIA}/moodboard/${style.id}.webp`} alt={`${style.label}材质板`} width={1200} height={900} sizes="(max-width: 900px) 33vw, 380px" />
            <figcaption><b>{style.label}</b><span>{style.words}</span></figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function ViewerEmbed() {
  const [started, setStarted] = useState(false);
  const src = `${BASE}/viewer/index.html?embed=1&style=natural`;

  return (
    <div className={s.viewerFrame}>
      <div className={s.viewerBar}>
        <span><i aria-hidden="true" />{started ? '交付成果 · 可交互 3D 方案' : '交付成果 · 3D 方案预览'}</span>
        <a href={`${BASE}/viewer/index.html?style=natural`} target="_blank" rel="noreferrer">全屏打开 ↗</a>
      </div>
      <div className={s.viewerStage}>
        {started ? (
          <iframe src={src} title="栖居 3D 方案查看器" allow="fullscreen" loading="lazy" />
        ) : (
          <>
            <Image unoptimized src={`${MEDIA}/shots/11-viewer-overview.webp`} alt="栖居 3D 方案查看器全屋总览" fill sizes="(max-width: 900px) 100vw, 1300px" />
            <div className={s.viewerStart}>
              <button type="button" onClick={() => setStarted(true)}>进入 3D 方案 <b aria-hidden="true">↗</b></button>
              <small>模型约 4.3 MB · 三种风格 · 13 个空间 · 日夜切换</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
