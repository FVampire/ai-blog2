'use client';

import { useState } from 'react';

import styles from './moling.module.css';

const steps = [
  ['理解目标', '章节目标', '沈晚白发现双重署名，决定是否把南岸的河写回灯册。'],
  ['选择上下文', '5 项引用', '沈晚白、顾衡、阿苔、双重署名、城北档案库'],
  ['构建计划', '4 个场景', '夜至档案库 → 对读笔迹 → 顾衡来访 → 湿石子'],
  ['多路竞态', '3 路候选', '文笔 / 结构 / 审慎；作者选择“结构”写入正文'],
  ['审稿检查', '1 个冲突', '顾衡到访与第三章夜班记录的 Canon 表述冲突'],
  ['局部修订', '只改 1 句', '顾衡又一次停在门槛外，像在等他把其中一行涂掉。'],
  ['确认定稿', '版本锁定', '第七章《灯册》进入已定稿状态'],
  ['同步记忆', '3 条回写', '伏笔推进、角色状态更新、卷二收到影响通知'],
] as const;

export default function PipelinePlayer() {
  const [activeStep, setActiveStep] = useState(0);
  const current = steps[activeStep];

  return (
    <div className={styles.pipelinePlayer}>
      <div className={styles.pipelineStage} aria-live="polite">
        <div className={styles.pipelineStageTop}><span>STEP {String(activeStep + 1).padStart(2, '0')}</span><b>{current[1]}</b></div>
        <p>{current[0]}</p>
        <blockquote>{current[2]}</blockquote>
        <div className={styles.pipelineMeta}><span>LOCAL WORKSPACE</span><span>PRESET DEMO DATA</span><span>NO LIVE MODEL REQUEST</span></div>
      </div>
      <ol className={styles.pipelineSteps} aria-label="创作流水线步骤">
        {steps.map(([title], index) => (
          <li key={title} className={index === activeStep ? styles.activePipelineStep : ''}>
            <button type="button" onClick={() => setActiveStep(index)} aria-current={index === activeStep ? 'step' : undefined}>
              <span>{String(index + 1).padStart(2, '0')}</span><b>{title}</b>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
