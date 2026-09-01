'use client';

import { useRef, useState } from 'react';

import styles from './moling.module.css';

const steps = [
  ['构建上下文', '成功', '从项目数据库装配章节目标、历史事实与相关角色。'],
  ['生成细纲', '成功', '为当前章生成场景、节拍、约束与验收标准。'],
  ['确认细纲', '成功', '自动模式确认规划版本，进入正文生成。'],
  ['生成正文', '成功', '第 9–11 章分别生成 4,291、4,911、4,798 字。'],
  ['确认草稿', '成功', '正文写入章节记录，保留可恢复的流程状态。'],
  ['抽取 Canon', '成功', '从新正文提取人物、物品、事件与状态变化。'],
  ['审阅更新', '自动跳过', '自动模式保留审计记录，直接进入结构化应用。'],
  ['应用更新', '成功', '把确认事实与章节结果同步回长篇状态。'],
  ['完成定稿', '成功', '三条工作流全部完成，失败数为 0。'],
] as const;

const VIDEO_DURATION = 17.2;

export default function PipelinePlayer() {
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = steps[activeStep];

  function seekTo(index: number) {
    const video = videoRef.current;
    setActiveStep(index);
    if (!video) return;
    video.currentTime = (index / steps.length) * (video.duration || VIDEO_DURATION);
    void video.play();
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play(); else video.pause();
  }

  return (
    <div className={styles.pipelinePlayer}>
      <figure className={styles.pipelineMedia}>
        <video
          ref={videoRef}
          src="/projects/moling/moling-real-flow-readable-v4.mp4"
          poster="/projects/moling/moling-project-overview-full-v5.png"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            const duration = video.duration || VIDEO_DURATION;
            setActiveStep(Math.min(steps.length - 1, Math.floor((video.currentTime / duration) * steps.length)));
          }}
        />
        <div className={styles.videoStage} aria-live="polite">
          <span>STEP {String(activeStep + 1).padStart(2, '0')} · {current[1]}</span>
          <b>{current[0]}</b>
          <p>{current[2]}</p>
        </div>
        <button type="button" className={styles.playPipeline} onClick={togglePlayback} aria-label={playing ? '暂停真实流程回放' : '播放真实流程回放'}>
          {playing ? 'Ⅱ' : '▶'}
        </button>
        <figcaption>真实流程 · 17.2 秒压缩回放 · 正文与规划全程可读</figcaption>
      </figure>
      <ol className={styles.pipelineSteps} aria-label="创作流水线步骤">
        {steps.map(([title, status], index) => (
          <li key={title} className={index === activeStep ? styles.activePipelineStep : ''}>
            <button type="button" onClick={() => seekTo(index)} aria-current={index === activeStep ? 'step' : undefined}>
              <span>{String(index + 1).padStart(2, '0')}</span><b>{title}</b><i>{status}</i>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
