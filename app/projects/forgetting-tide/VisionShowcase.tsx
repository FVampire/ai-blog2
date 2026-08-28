'use client';

import { useState } from 'react';

import Image from 'next/image';

import styles from './forgetting-tide.module.css';

const visions = [
  {
    id: 'narrative',
    label: '剧情与证词',
    kicker: '01 · TESTIMONY WALL',
    title: '三位见证者的证词如何互相支持、互相冲突',
    description: '见证墙把主张、物证、反证与责任分开记录。固定一种主映照后，另外两份证词仍被保存，并继续影响后续地图、NPC 与事件。',
    points: ['三位见证者与独立旁证', '事实与感受分层记录', '选择前预览地图、生态与敌人变化'],
    image: '/projects/forgetting-tide/vision/testimony-wall-final.png',
    alt: '最终产品的灰烬医院见证墙与剧情图谱界面',
  },
  {
    id: 'skills',
    label: '技能池与构筑',
    kicker: '02 · BUILD WORKBENCH',
    title: '在一屏内完成队伍、技能与资源预演',
    description: '技能不再属于单一角色固定列表，而由属性阵营、种族谱系和战术倾向共同开放。队长技改变行动语法，构筑摘要则提前解释这套队伍为什么成立。',
    points: ['五色资源与克制环', '共享技能池与资格过滤', '队长技、天赋星图与 Build 预演'],
    image: '/projects/forgetting-tide/vision/skill-pool-final.png',
    alt: '最终产品的队伍构筑、五色资源与技能池界面',
  },
  {
    id: 'creature',
    label: '生物图鉴',
    kicker: '03 · LIVING CODEX',
    title: '图鉴同时记录生态、召回进度和成长分支',
    description: '完整体图鉴会同时容纳生态观察、召回进度、核心天赋、同行记忆与最终解释。进化不是稀有度，而是同一轮廓被新关系和新选择重新塑形。',
    points: ['观察—记录—召回的身份进度', '三阶段同行记忆路径', '两种最终自我解释，不设稀有度星级'],
    image: '/projects/forgetting-tide/vision/creature-codex-final.png',
    alt: '最终产品的灯尾兔生物图鉴与同行记忆界面',
  },
];

export default function VisionShowcase() {
  const [activeId, setActiveId] = useState(visions[0].id);
  const active = visions.find((item) => item.id === activeId) ?? visions[0];

  return (
    <div className={styles.visionShowcase}>
      <div className={styles.visionTabs} role="tablist" aria-label="最终产品系统界面">
        {visions.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === active.id}
            className={item.id === active.id ? styles.activeVisionTab : ''}
            onClick={() => setActiveId(item.id)}
          >
            <span>0{index + 1}</span><b>{item.label}</b>
          </button>
        ))}
      </div>

      <div className={styles.visionStage} role="tabpanel">
        <div className={styles.visionImage}>
          <Image src={active.image} alt={active.alt} fill sizes="(max-width: 900px) 100vw, 68vw" priority={active.id === 'narrative'} />
          <span>FINAL PRODUCT UI · SYSTEM SHOWCASE</span>
        </div>
        <div className={styles.visionCopy}>
          <span>{active.kicker}</span>
          <h3>{active.title}</h3>
          <p>{active.description}</p>
          <ul>{active.points.map((point) => <li key={point}>{point}</li>)}</ul>
          <small>最终产品界面 · 系统与美术整合展示</small>
        </div>
      </div>
    </div>
  );
}
