'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import styles from './moling.module.css';

const steps = [
  ['理解章节目标', '沈晚白发现双重署名，决定是否把南岸的河写回灯册。'],
  ['选择故事上下文', '角色、伏笔与城北档案库五张引用卡同时就位。'],
  ['构建场景计划', '夜至档案库 → 对读笔迹 → 顾衡来访 → 湿石子。'],
  ['多模型竞态', '文笔、结构、审慎三路候选并行，选择“结构”。'],
  ['审稿与一致性', '识别顾衡到访与第三章夜班记录之间的冲突。'],
  ['进行局部修订', '只改动冲突句，保留其余段落的节奏与笔触。'],
  ['用户确认定稿', '第七章《灯册》进入已定稿状态。'],
  ['同步故事记忆', '双重署名推进中，卷二顾衡出场收到影响通知。'],
];

export default function PipelinePlayer() {
  const [activeStep, setActiveStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [compact, setCompact] = useState(true);
  const [mobilePlaying, setMobilePlaying] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 768px)');
    const sync = () => { setReducedMotion(motion.matches); setCompact(mobile.matches); };
    sync();
    motion.addEventListener('change', sync);
    mobile.addEventListener('change', sync);
    return () => { motion.removeEventListener('change', sync); mobile.removeEventListener('change', sync); };
  }, []);

  const showVideo = !reducedMotion && (!compact || mobilePlaying);

  return (
    <div className={styles.pipelinePlayer}>
      <div className={styles.pipelineMedia}>
        {showVideo ? (
          <video
            muted
            loop
            playsInline
            autoPlay
            controls={compact}
            poster="/projects/moling/video/agent-pipeline-poster.png"
            aria-label="墨灵用预设稿演示从章节目标到同步 Canon 的八步创作闭环"
            onTimeUpdate={(event) => setActiveStep(Math.min(7, Math.floor(event.currentTarget.currentTime / 1.625)))}
          >
            <source src="/projects/moling/video/agent-pipeline.webm" type="video/webm" />
            <source src="/projects/moling/video/agent-pipeline.mp4" type="video/mp4" />
          </video>
        ) : (
          <Image
            src="/projects/moling/video/agent-pipeline-poster.png"
            alt="《南岸无灯》第七章的八步创作流水线，结构候选被选中并推进双重署名伏笔"
            fill
            sizes="(max-width: 900px) 100vw, 68vw"
          />
        )}
        {compact && !reducedMotion && !mobilePlaying && (
          <button type="button" className={styles.playPipeline} onClick={() => setMobilePlaying(true)} aria-label="播放创作流水线演示">
            <span aria-hidden="true">▶</span> 播放 13 秒演示
          </button>
        )}
        <span className={styles.videoDescription}>静音演示 · 预设稿回放 · 13 秒循环</span>
      </div>
      <ol className={styles.pipelineSteps} aria-label="创作流水线步骤">
        {steps.map(([title, copy], index) => (
          <li key={title} className={index === activeStep && showVideo ? styles.activePipelineStep : ''}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><b>{title}</b><p>{copy}</p></div>
          </li>
        ))}
      </ol>
    </div>
  );
}
