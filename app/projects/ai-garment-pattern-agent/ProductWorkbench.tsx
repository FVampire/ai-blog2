"use client";
import { useState } from "react";

import Image from "next/image";

import styles from "./showcase.module.css";
const views = [
  {
    title: "设计与 3D",
    label: "DESIGN STUDIO",
    headline: "先看整体，再深入细节。",
    copy: "将服装外观、结构预览与设计对话放在同一视野，围绕廓形、领袖和面料意图持续推敲。",
    image: "studio-vision-v2.webp",
    alt: "衬衫产品概念工作台，包含三维外观和二维结构",
    caption: "产品效果演示 · AI 生成视觉",
    tags: ["款式参考", "结构预览", "设计对话"],
  },
  {
    title: "2D 纸样",
    label: "PATTERN WORKSPACE",
    headline: "从服装结构，深入到每一片纸样。",
    copy: "查看衣身、袖片、领与克夫的结构关系，在纸样画布上检查轮廓和工艺标记，连接参数调整与文件输出。",
    image: "real-workbench-pattern.webp",
    alt: "SEAM 现有工作台的二维纸样画布",
    caption: "工作台实机画面",
    tags: ["参数化裁片", "缝份与纱向", "几何校验"],
  },
  {
    title: "样衣技术包",
    label: "SAMPLE HANDOFF",
    headline: "让制作信息，跟着设计一起走。",
    copy: "把工序、面辅料和成衣尺寸集中整理，配合可打印技术包，为样衣制作与后续复核建立清楚的参照。",
    image: "real-tech-pack.webp",
    alt: "SEAM 现有工作台的样衣技术包",
    caption: "工作台实机画面",
    tags: ["工艺操作卡", "面辅料 BOM", "尺寸与公差"],
  },
];
export default function ProductWorkbench() {
  const [active, setActive] = useState(0);
  const view = views[active];
  return (
    <div className={styles.workbench}>
      <div className={styles.viewTabs} role="tablist" aria-label="工作台视图">
        {views.map((item, index) => (
          <button
            key={item.title}
            id={`view-tab-${index}`}
            role="tab"
            aria-selected={index === active}
            aria-controls="workbench-panel"
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (active + 1) % views.length
                  : event.key === "ArrowLeft"
                    ? (active + views.length - 1) % views.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? views.length - 1
                        : null;
              if (next !== null) {
                event.preventDefault();
                setActive(next);
                document.getElementById(`view-tab-${next}`)?.focus();
              }
            }}
          >
            <span>0{index + 1}</span>
            {item.title}
          </button>
        ))}
        <span className={styles.viewProject}>EVERYDAY SHIRT / 款式探索</span>
      </div>
      <div
        id="workbench-panel"
        role="tabpanel"
        aria-labelledby={`view-tab-${active}`}
        className={styles.viewPanel}
        tabIndex={0}
      >
        <figure>
          <div className={styles.viewImage}>
            <Image
              src={`/projects/ai-garment-pattern-agent/${view.image}`}
              alt={view.alt}
              fill
              sizes="(max-width: 760px) 100vw, 850px"
            />
          </div>
          <figcaption>{view.caption}</figcaption>
        </figure>
        <div className={styles.viewCopy}>
          <p className={styles.eyebrow}>{view.label}</p>
          <h3>{view.headline}</h3>
          <p>{view.copy}</p>
          <ul>
            {view.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <span className={styles.viewIndex}>
            0{active + 1}
            <small> / 03</small>
          </span>
        </div>
      </div>
    </div>
  );
}
