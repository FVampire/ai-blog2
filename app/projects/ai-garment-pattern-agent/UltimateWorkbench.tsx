"use client";
import { useState } from "react";

import Image from "next/image";

import { ULTIMATE_MEDIA as media } from "./ultimate-media";
import styles from "./ultimate.module.css";

const screens = [
  {
    title: "设计中枢",
    image: media.studio,
    heading: "让一次设计变化，贯穿整套工程。",
    copy: "对话与设计参考保留在左侧，成衣和四视图位于中央，规格、资产与改版影响集中在右侧。",
    details: ["参考图与自然语言", "参数差异与影响范围", "统一款式与项目版本"],
  },
  {
    title: "纸样工程",
    image: media.pattern,
    heading: "每片纸样，都有结构、身份和计算来源。",
    copy: "查看实际生成的裁片几何、裁量与材料层，追溯规格如何变成引擎参数，再进入毫米级曲线与装配检查。",
    details: ["13 个生产裁片", "14 条缝合配对", "308 个计算项"],
  },
  {
    title: "虚拟试衣",
    image: media.fitting,
    heading: "把材质、结构与穿着外观放进同一场景。",
    copy: "从完整的成衣表达进入裁片、缝合、网格与面料视图，让肩部、衣身和袖窿的观察回到具体设计部位。",
    details: ["多角度成衣预览", "材质与场景图层", "结构与试衣观察"],
  },
  {
    title: "物料与成本",
    image: media.bom,
    heading: "每一项用量，都关联到材料与制作位置。",
    copy: "实际 BOM 包含主料、粘合衬、纽扣、缝纫线和样衣标识。终极版将用量追溯、材料细项、工序费用与批量成本统一组织。",
    details: [
      "主料 1.38 m / 衬料 0.14 m",
      "13 颗纽扣 / 167 m 缝纫线",
      "材料 → 用量 → 单价 → 成本",
    ],
  },
  {
    title: "样衣复核",
    image: media.quality,
    heading: "让每一个尺寸偏差，都有下一步。",
    copy: "成衣目标、工艺补偿、纸样控制值与实测值并排对照。超差项对应测量部位和裁片，样衣记录进入项目时间线。",
    details: ["9 项关键 POM", "目标、补偿与公差", "偏差定位与版本留痕"],
  },
];
export default function UltimateWorkbench() {
  const [active, setActive] = useState(3);
  const screen = screens[active];
  return (
    <div className={styles.workbench}>
      <div className={styles.tabs} role="tablist" aria-label="终极版工作区">
        {screens.map((s, i) => (
          <button
            key={s.title}
            id={`ultimate-tab-${i}`}
            role="tab"
            aria-selected={i === active}
            aria-controls="ultimate-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight"
                  ? (active + 1) % screens.length
                  : e.key === "ArrowLeft"
                    ? (active + screens.length - 1) % screens.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? screens.length - 1
                        : null;
              if (next !== null) {
                e.preventDefault();
                setActive(next);
                document.getElementById(`ultimate-tab-${next}`)?.focus();
              }
            }}
          >
            <span>0{i + 1}</span>
            {s.title}
          </button>
        ))}
      </div>
      <div
        id="ultimate-panel"
        role="tabpanel"
        aria-labelledby={`ultimate-tab-${active}`}
        tabIndex={0}
      >
        <figure className={styles.workspaceImage}>
          <Image
            key={screen.image}
            src={screen.image}
            alt={`SEAM ${screen.title}完整产品界面设计`}
            width={1440}
            height={1000}
            unoptimized
          />
          <figcaption>
            <span>BLUE OXFORD SHIRT / {screen.title}</span>
            <a href={screen.image} target="_blank" rel="noreferrer">
              查看高清 ↗
            </a>
          </figcaption>
        </figure>
        <div className={styles.workspaceCopy}>
          <div>
            <h3>{screen.heading}</h3>
            <p>{screen.copy}</p>
          </div>
          <ul>
            {screen.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
