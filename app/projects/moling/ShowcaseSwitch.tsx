'use client';

import { useRef, useState } from 'react';

import ImageLightbox from './ImageLightbox';
import styles from './moling.module.css';

const showcases = [
  {
    id: 'run',
    label: '三章总览',
    kicker: '01 · AUTHENTIC RUN',
    title: '不是一张孤立截图，而是一条跑完的长篇工作流。',
    description: '同一真实项目连续完成第 9–11 章。正文、章节标题和任务信息全部来自实际流程，并保持可读。',
    src: '/projects/moling/moling-project-overview-full-v5.png',
    alt: '墨灵真实三章项目总览，显示十一章完成度与章节树',
    caption: '11 / 11 FINALIZED · THREE-CHAPTER RUN',
  },
  {
    id: 'chapter-outline',
    label: '章节细纲',
    kicker: '02 · CHAPTER OUTLINE',
    title: '场景、节拍与约束，不再藏在正文背后。',
    description: '第 11 章真实细纲完整展示支线目标、场景节拍、角色参与和校验状态，可直接对照成稿效果。',
    src: '/projects/moling/moling-chapter-outline-clean-v5.png',
    alt: '墨灵第十一章真实细纲界面',
    caption: 'SCENES · BEATS · CONSTRAINTS · VALIDATION',
  },
  {
    id: 'studio',
    label: '正文定稿',
    kicker: '03 · CHAPTER STUDIO',
    title: '细纲确认以后，定稿正文才进入完整工作台。',
    description: '第 11 章真实定稿状态。正文、章节树、字数、工具栏和本地保存状态完整展示，正文可直接阅读。',
    src: '/projects/moling/moling-chapter-studio-full-v5.png',
    alt: '墨灵真实章节工作台完整截图',
    caption: 'CHAPTER 11 · FINALIZED · LOCAL SAVE',
  },
  {
    id: 'outline',
    label: '全书大纲',
    kicker: '04 · OUTLINE WORKBENCH',
    title: '单章写完以后，仍能回到全书结构中检查位置。',
    description: '纵向大纲同时显示 11 章历史、下一章目标、角色出场计划与必须发生事项，局部修改有明确边界。',
    src: '/projects/moling/moling-outline-workbench-full-v5.png',
    alt: '墨灵真实全书大纲工作台',
    caption: '11 CHAPTERS · NEXT GOAL · CHARACTER PLAN',
  },
  {
    id: 'tasks',
    label: '任务收束',
    kicker: '05 · TASK COMMAND',
    title: '完成不等于消失：影响、提醒与时间线继续可追踪。',
    description: '任务中心真实记录 11/11 章完成度、项目字数、后处理提醒和历史时间线，具体提醒内容也保持可读。',
    src: '/projects/moling/moling-task-center-full-v5.png',
    alt: '墨灵真实任务中心完整截图',
    caption: '11 / 11 FINALIZED · TRACEABLE HISTORY',
  },
] as const;

export default function ShowcaseSwitch() {
  const [activeId, setActiveId] = useState<(typeof showcases)[number]['id']>('run');
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(0, showcases.findIndex((item) => item.id === activeId));
  const active = showcases[activeIndex];

  function selectAt(index: number) {
    const nextIndex = (index + showcases.length) % showcases.length;
    setActiveId(showcases[nextIndex].id);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div className={styles.showcaseSwitch}>
      <div className={styles.showcaseTabs} role="tablist" aria-label="墨灵长篇创作系统">
        {showcases.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => { buttonRefs.current[index] = node; }}
            id={`moling-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={item.id === active.id}
            aria-controls={`moling-panel-${item.id}`}
            tabIndex={item.id === active.id ? 0 : -1}
            onClick={() => setActiveId(item.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') { event.preventDefault(); selectAt(activeIndex + 1); }
              if (event.key === 'ArrowLeft') { event.preventDefault(); selectAt(activeIndex - 1); }
              if (event.key === 'Home') { event.preventDefault(); selectAt(0); }
              if (event.key === 'End') { event.preventDefault(); selectAt(showcases.length - 1); }
            }}
          >
            <span>0{index + 1}</span><b>{item.label}</b>
          </button>
        ))}
      </div>

      <div id={`moling-panel-${active.id}`} role="tabpanel" aria-labelledby={`moling-tab-${active.id}`} className={styles.showcasePanel}>
        <figure className={styles.finalShowcaseImage}>
          <ImageLightbox src={active.src} alt={active.alt} label={active.label} />
          <figcaption>{active.caption} · 站内放大查看</figcaption>
        </figure>
        <div className={styles.showcaseCopy}>
          <span>{active.kicker}</span>
          <h3>{active.title}</h3>
          <p>{active.description}</p>
          <small>真实实机截图 · 完整正文 · 仅做构图与光影精修</small>
        </div>
      </div>
    </div>
  );
}
