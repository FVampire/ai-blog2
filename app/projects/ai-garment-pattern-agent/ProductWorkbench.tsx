"use client";
import { useState } from "react";

import Image from "next/image";

import styles from "./showcase.module.css";
import TechPackPreview from "./TechPackPreview";
const views = [
  {
    title: "智能工作台",
    label: "DESIGN STUDIO",
    headline: "先看整体，再深入细节。",
    copy: "左侧编排制版任务，中间查看款式和裁片，右侧调整结构参数。11 项款式操作与 25 项装配关系，汇入同一个工作区。",
    image:
      "https://blog-1304232496.cos.ap-shanghai.myqcloud.com/uploads/1788615421150-775873709.webp",
    alt: "手工构建的裹式上衣智能工作台",
    caption: "工作台界面演示 · 真实案例数据",
    tags: ["款式参考", "结构预览", "设计对话"],
  },
  {
    title: "2D 纸样",
    label: "PATTERN WORKSPACE",
    headline: "从服装结构，深入到每一片纸样。",
    copy: "查看衣身、袖片、领与克夫的结构关系，在纸样画布上检查轮廓和工艺标记，连接参数调整与文件输出。",
    image:
      "https://blog-1304232496.cos.ap-shanghai.myqcloud.com/uploads/1788615422732-486445896.webp",
    alt: "真实项目的十四个裁片几何在纸样工作区排列",
    caption: "纸样工作区演示 · 真实 PatternGraph 轮廓",
    tags: ["参数化裁片", "缝份与纱向", "几何校验"],
  },
  {
    title: "样衣技术包",
    label: "SAMPLE HANDOFF",
    headline: "让制作信息，跟着设计一起走。",
    copy: "把工序、面辅料和成衣尺寸集中整理，配合可打印技术包，为样衣制作与后续复核建立清楚的参照。",
    alt: "SEAM 现有工作台的样衣技术包",
    caption: "技术包产品演示",
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
        <span className={styles.viewProject}>WRAP BLOUSE / 工程视图</span>
      </div>
      <div
        id="workbench-panel"
        role="tabpanel"
        aria-labelledby={`view-tab-${active}`}
        className={styles.viewPanel}
        tabIndex={0}
      >
        <figure>
          {!view.image ? (
            <TechPackPreview />
          ) : (
            <div className={styles.viewImage}>
              <Image
                src={view.image}
                unoptimized
                alt={view.alt}
                fill
                sizes="(max-width: 760px) 100vw, 850px"
              />
            </div>
          )}
          <figcaption>
            {view.caption}
            {view.image && (
              <a
                href={view.image}
                target="_blank"
                rel="noreferrer"
                className={styles.zoomLink}
              >
                查看高清 ↗
              </a>
            )}
          </figcaption>
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
