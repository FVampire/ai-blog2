'use client';

import { useRef, useState } from 'react';

import Image from 'next/image';

import styles from './moling.module.css';

const showcases = [
  {
    id: 'planning',
    label: '故事规划',
    kicker: '01 · OUTLINE WORKBENCH',
    title: '先看清影响边界，再决定改哪里。',
    description: '总纲、分卷、故事弧与章节目标沿同一条规划链展开。页面直接展示结构与状态，不再用模糊横杠代替信息。',
  },
  {
    id: 'world',
    label: '角色档案',
    kicker: '02 · CHARACTER ARTIFACT',
    title: '角色不仅被记住，也能被整理成可交付的档案。',
    description: '这是墨灵真实导出的角色卡样张：基础设定、关系、经历与视觉形象被组织到同一张可保存的创作资料中。',
  },
  {
    id: 'memory',
    label: '长篇记忆',
    kicker: '03 · CANON MEMORY',
    title: '事实、证据与伏笔状态一起进入下一章。',
    description: 'Canon 不是装饰性的关系图，而是带来源、状态与影响范围的记录。定稿之后，变化会回写到后续创作上下文。',
  },
] as const;

export default function ShowcaseSwitch() {
  const [activeId, setActiveId] = useState<(typeof showcases)[number]['id']>('planning');
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
        <div className={styles.systemVisual}>
          {active.id === 'planning' && <PlanningProof />}
          {active.id === 'world' && (
            <figure className={styles.characterArtifact}>
              <Image src="/projects/moling/character-card-authentic.png" alt="墨灵真实导出的角色卡样张，包含人物形象、档案、关系和经历" fill sizes="(max-width: 768px) 100vw, 62vw" />
              <figcaption>REAL EXPORT · CHARACTER DOSSIER</figcaption>
            </figure>
          )}
          {active.id === 'memory' && <CanonProof />}
        </div>
        <div className={styles.showcaseCopy}>
          <span>{active.kicker}</span>
          <h3>{active.title}</h3>
          <p>{active.description}</p>
          <small>真实产品结构 · 页面级信息重组</small>
        </div>
      </div>
    </div>
  );
}

function PlanningProof() {
  return (
    <div className={styles.planningProof} aria-label="故事规划结构示意">
      <div className={styles.proofTop}><span>南岸无灯 · 故事规划</span><b>已保存</b></div>
      <div className={styles.planTree}>
        <div><small>总纲</small><b>一座逐渐遗忘河流的城</b><span>当前版本</span></div>
        <div><small>卷一</small><b>入城</b><span>7 / 10 章</span></div>
        <div className={styles.activePlan}><small>第七章</small><b>灯册</b><span>正在编辑</span></div>
      </div>
      <div className={styles.impactCard}><small>本次调整影响</small><strong>2</strong><p>第七章目标 · 卷二顾衡出场</p></div>
      <div className={styles.safeCard}><span>✓</span><div><b>其余 18 章不受影响</b><p>未关联内容保持原版本</p></div></div>
    </div>
  );
}

function CanonProof() {
  return (
    <div className={styles.canonProof} aria-label="Canon 事实与伏笔状态">
      <div className={styles.proofTop}><span>Canon · 第七章同步结果</span><b>3 条变化</b></div>
      <article><span className={styles.canonIndex}>01</span><div><small>事实</small><b>灯册存在双重署名</b><p>证据：第三章《夜班记录》、第七章《灯册》</p></div><i>已确认</i></article>
      <article><span className={styles.canonIndex}>02</span><div><small>伏笔</small><b>双重署名</b><p>埋设 → 推进；后续章节自动携带</p></div><i>推进中</i></article>
      <article><span className={styles.canonIndex}>03</span><div><small>影响</small><b>顾衡的档案库出场</b><p>卷二相关场景需要与门槛场景对齐</p></div><i>待处理</i></article>
    </div>
  );
}
