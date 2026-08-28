'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './forgetting-tide.module.css';

const tracks = [
  {
    id: 'lighthouse',
    index: '01',
    title: '记忆灯塔',
    titleEn: 'Memory Lighthouse',
    scene: '营地 / 归航',
    note: '钟琴般的微光与缓慢脉冲，保留一个尚未熄灭的安全坐标。',
    src: '/projects/forgetting-tide/audio/memory-lighthouse.ogg',
  },
  {
    id: 'ruins',
    index: '02',
    title: '遗忘遗迹',
    titleEn: 'Forgotten Ruins',
    scene: '探索 / 迷雾',
    note: '低频潮声与稀疏旋律，让方向感像一段正在褪色的回忆。',
    src: '/projects/forgetting-tide/audio/forgotten-ruins.ogg',
  },
  {
    id: 'battle',
    index: '03',
    title: '共鸣战斗',
    titleEn: 'Resonance Battle',
    scene: '战斗 / 共鸣',
    note: '把行动节拍与逐步叠加的紧张感放在同一条循环里。',
    src: '/projects/forgetting-tide/audio/resonance-battle.ogg',
  },
  {
    id: 'witness',
    index: '04',
    title: '潮汐见证者',
    titleEn: 'Tide Witness',
    scene: '首领 / 裁决',
    note: '压低的人声质感与不稳定和声，回应“谁有权定义真相”。',
    src: '/projects/forgetting-tide/audio/tide-witness.ogg',
  },
];

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const current = tracks[active];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [active, playing]);

  const toggle = () => {
    setPlaying((value) => !value);
  };

  const choose = (index: number) => {
    if (index === active) return toggle();
    setActive(index);
    setPlaying(true);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.musicPlayer}>
      <audio
        ref={audioRef}
        src={current.src}
        loop
        onLoadStart={() => setProgress(0)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />

      <div className={styles.nowPlaying}>
        <div className={`${styles.vinyl} ${playing ? styles.vinylPlaying : ''}`} aria-hidden="true">
          <div><span /></div>
        </div>
        <div className={styles.nowCopy}>
          <p>NOW PLAYING · ORIGINAL SCORE</p>
          <h3>{current.title}</h3>
          <span>{current.titleEn}</span>
          <p className={styles.trackNote}>{current.note}</p>
        </div>
        <button className={styles.mainPlay} onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
          {playing ? 'Ⅱ' : '▶'}
        </button>
        <div className={styles.timeline}>
          <button
            aria-label="调整播放进度"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const next = ((event.clientX - rect.left) / rect.width) * duration;
              if (audioRef.current) audioRef.current.currentTime = next;
            }}
          >
            <span style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
          </button>
          <div><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
        </div>
      </div>

      <div className={styles.trackList}>
        {tracks.map((track, index) => (
          <button
            key={track.id}
            className={index === active ? styles.activeTrack : ''}
            onClick={() => choose(index)}
          >
            <span className={styles.trackIndex}>{index === active && playing ? '◼' : track.index}</span>
            <span className={styles.trackTitle}><b>{track.title}</b><small>{track.titleEn}</small></span>
            <span className={styles.trackScene}>{track.scene}</span>
            <span className={styles.trackAction}>{index === active && playing ? 'PAUSE' : 'PLAY'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
