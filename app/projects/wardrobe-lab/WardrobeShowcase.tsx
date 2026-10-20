'use client';

import Image from 'next/image';
import { useState } from 'react';

import s from './wardrobe.module.css';

const BASE = '/projects/wardrobe-lab';

const PAIRS = [
  { id: '01-lowlight', label: '低光照', note: '提亮暗部，保留皮肤与面料质感。' },
  { id: '02-lowcontrast', label: '低对比', note: '恢复层次，衣物轮廓重新清晰。' },
  { id: '03-lowres', label: '低分辨率', note: '重建细节，适合继续换装。' },
] as const;

export function QualityCompare() {
  const [pair, setPair] = useState<(typeof PAIRS)[number]['id']>('01-lowlight');
  const [split, setSplit] = useState(50);
  const current = PAIRS.find((p) => p.id === pair)!;

  return (
    <div className={s.quality}>
      <div className={s.qualityTabs} role="group" aria-label="画质修复类型">
        {PAIRS.map((p) => (
          <button key={p.id} type="button" aria-pressed={p.id === pair} onClick={() => setPair(p.id)}>{p.label}</button>
        ))}
        <span>{current.note}</span>
      </div>
      <div className={s.compare}>
        <Image src={`${BASE}/media/quality/${pair}-after.webp`} alt={`${current.label}修复后`} fill sizes="(max-width: 900px) 100vw, 760px" />
        <div className={s.compareLeft} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <Image src={`${BASE}/media/quality/${pair}-before.webp`} alt={`${current.label}原图`} fill sizes="(max-width: 900px) 100vw, 760px" />
        </div>
        <span className={s.compareHandle} style={{ left: `${split}%` }} aria-hidden="true" />
        <span className={s.tagLeft}>原图</span>
        <span className={s.tagRight}>修复后</span>
        <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} aria-label="拖动对比修复前后" />
      </div>
    </div>
  );
}

export function LookViewerEmbed() {
  const [started, setStarted] = useState(false);

  return (
    <div className={s.viewerFrame}>
      <div className={s.viewerBar}>
        <span><i aria-hidden="true" />交付成果 · 造型查看器</span>
        <a href={`${BASE}/viewer/index.html`} target="_blank" rel="noreferrer">全屏打开 ↗</a>
      </div>
      <div className={s.viewerStage}>
        {started ? (
          <iframe src={`${BASE}/viewer/index.html?embed=1`} title="Wardrobe Studio 造型查看器" loading="lazy" />
        ) : (
          <>
            <Image src={`${BASE}/shots/08-viewer.webp`} alt="造型查看器：同一个人，七种造型" fill sizes="(max-width: 900px) 100vw, 1300px" />
            <div className={s.viewerStart}>
              <button type="button" onClick={() => setStarted(true)}>亲手试试七种造型 <b aria-hidden="true">↗</b></button>
              <small>拖动对比 · 键盘 ← → 切换 · 手机可横滑</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
