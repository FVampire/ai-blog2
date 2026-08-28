'use client';

import { useRef, useState } from 'react';

import styles from './moling.module.css';
import ProductWindow from './ProductWindow';

const showcases = [
  {
    id: 'planning',
    label: '故事规划',
    kicker: '01 · OUTLINE WORKBENCH',
    title: '上层改动，只触达真正受影响的章节。',
    description: '总纲、分卷、故事弧与章节 Slot 共享同一条规划链。调整《灯册》时，墨灵标出影响范围，同时保护未受影响的内容。',
    points: ['三卷结构与章节状态同屏', '场景 Slot 连接章节目标', '局部调整与影响通知'],
    image: '/projects/moling/showcase/outline-workbench.png',
    alt: '《南岸无灯》故事规划中枢展示三卷结构、第七章《灯册》和四个场景 Slot',
  },
  {
    id: 'world',
    label: '故事世界',
    kicker: '02 · LIVING STORY WORLD',
    title: '人物不是一张静态卡片，而是一段持续变化的关系。',
    description: '沈晚白、顾衡与阿苔的称谓、别名、位置和立场会随章节推进更新，后续生成读到的是此刻的他们。',
    points: ['人物、地点与关系共同建模', '章节级状态持续同步', '称谓与别名保持一致'],
    image: '/projects/moling/showcase/story-world.png',
    alt: '《南岸无灯》人物关系图连接沈晚白、顾衡、阿苔、城北档案库与南岸无灯区',
  },
  {
    id: 'memory',
    label: '长篇记忆',
    kicker: '03 · CANON MEMORY',
    title: '每一次定稿，都在更新这个世界对自己的记忆。',
    description: 'Canon 事实保留证据来源，伏笔在埋设、推进与回收之间流动。一致性提示会在矛盾写进后文以前出现。',
    points: ['事实与章节证据互相指认', '伏笔状态贯穿全书', '相关上下文精准进入生成'],
    image: '/projects/moling/showcase/canon-memory.png',
    alt: '《南岸无灯》长篇记忆引擎展示双重署名伏笔推进中及顾衡到访一致性提示',
  },
];

export default function ShowcaseSwitch() {
  const [activeId, setActiveId] = useState(showcases[0].id);
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
            className={item.id === active.id ? styles.activeShowcaseTab : ''}
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

      <div
        id={`moling-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`moling-tab-${active.id}`}
        className={styles.showcasePanel}
      >
        <ProductWindow src={active.image} alt={active.alt} label={`${active.label} · 南岸无灯`} />
        <div className={styles.showcaseCopy}>
          <span>{active.kicker}</span>
          <h3>{active.title}</h3>
          <p>{active.description}</p>
          <ul>{active.points.map((point) => <li key={point}>{point}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
