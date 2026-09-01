'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './moling.module.css';

const steps = [
  { title: '创建项目', status: '完整操作', description: '填写作品名称、类型、规模与一句话故事，创建本地长篇项目。', start: 0, end: 2.8 },
  { title: '章节目标', status: '上下文', description: '进入第七章《灯册》，理解章节目标并点亮相关人物、伏笔与地点。', start: 2.8, end: 5.5 },
  { title: 'AI 输出细纲', status: '逐项生成', description: '四个场景依次生成，同时展示节拍、约束与结尾钩子。', start: 5.5, end: 9 },
  { title: '多模型竞态', status: '三路并行', description: '文笔、结构、审慎三路候选同时出现，比较后选中结构稿。', start: 9, end: 13 },
  { title: 'AI 输出正文', status: '逐字回放', description: '预先筛选的优胜正文按打字机节奏写入编辑器，速度与质量都可控。', start: 13, end: 21 },
  { title: '审稿与修订', status: '局部修改', description: '识别顾衡到访记录冲突，只替换问题句，不重写已经成立的段落。', start: 21, end: 24 },
  { title: '定稿与同步', status: '世界记忆', description: '确认定稿，并同步章节摘要、角色状态、Canon 与后续影响通知。', start: 24, end: 27.5 },
] as const;

const VIDEO_DURATION = 27.5;

export default function PipelinePlayer() {
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = steps[activeStep];

  useEffect(() => {
    const video = videoRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = window.matchMedia('(min-width: 769px)').matches;
    if (video && desktop && !reducedMotion) void video.play().catch(() => setPlaying(false));
  }, []);

  function seekTo(index: number) {
    const video = videoRef.current;
    const next = steps[index];
    setActiveStep(index);
    setProgress((next.start / VIDEO_DURATION) * 100);
    if (!video) return;
    video.currentTime = next.start + 0.02;
    void video.play().catch(() => setPlaying(false));
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false)); else video.pause();
  }

  return (
    <div className={styles.pipelinePlayer}>
      <figure className={styles.pipelineMedia}>
        <div className={styles.pipelineViewport}>
          <video
            ref={videoRef}
            poster="/projects/moling/video/complete-workflow-v1-poster.png"
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="墨灵从创建《南岸无灯》项目，到生成细纲、多模型竞态、逐字生成正文、审稿修订和同步故事记忆的完整演示"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(event) => {
              const currentTime = event.currentTarget.currentTime;
              const index = steps.findIndex((step) => currentTime >= step.start && currentTime < step.end);
              setActiveStep(index < 0 ? steps.length - 1 : index);
              setProgress((currentTime / VIDEO_DURATION) * 100);
            }}
          >
            <source src="/projects/moling/video/complete-workflow-v1.webm" type="video/webm" />
            <source src="/projects/moling/video/complete-workflow-v1.mp4" type="video/mp4" />
          </video>
          <div className={styles.pipelineProgress} aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
          <button type="button" className={styles.playPipeline} onClick={togglePlayback} aria-label={playing ? '暂停完整流程回放' : '播放完整流程回放'}>
            {playing ? 'Ⅱ' : '▶'}
          </button>
        </div>
        <figcaption className={styles.pipelineReadout} aria-live="polite">
          <span>STEP {String(activeStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
          <div><b>{current.title}</b><p>{current.description}</p></div>
          <time>{current.start.toFixed(1)}s</time>
        </figcaption>
      </figure>
      <ol className={styles.pipelineSteps} aria-label="创作流水线步骤">
        {steps.map((step, index) => (
          <li key={step.title} className={index === activeStep ? styles.activePipelineStep : ''}>
            <button type="button" onClick={() => seekTo(index)} aria-current={index === activeStep ? 'step' : undefined}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.pipelineStepCopy}><b>{step.title}</b><small>{step.description}</small></span>
              <i>{step.status}</i>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
