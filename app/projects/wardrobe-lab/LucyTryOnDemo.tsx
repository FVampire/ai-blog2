"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import styles from "./wardrobe-lab.module.css";

const looks = [
  {
    id: "base",
    label: "原始画面",
    shortLabel: "原始",
    video: "/projects/wardrobe-lab/lucy/base.mp4",
    poster: "/projects/wardrobe-lab/lucy/base.jpg",
  },
  {
    id: "05",
    label: "双排扣西装",
    shortLabel: "西装",
    video: "/projects/wardrobe-lab/lucy/05.mp4",
    poster: "/projects/wardrobe-lab/lucy/05.jpg",
  },
  {
    id: "04",
    label: "军装工装夹克",
    shortLabel: "夹克",
    video: "/projects/wardrobe-lab/lucy/04.mp4",
    poster: "/projects/wardrobe-lab/lucy/04.jpg",
  },
  {
    id: "03",
    label: "粉色街头造型",
    shortLabel: "街头",
    video: "/projects/wardrobe-lab/lucy/03.mp4",
    poster: "/projects/wardrobe-lab/lucy/03.jpg",
  },
  {
    id: "02",
    label: "西部幽灵造型",
    shortLabel: "西部",
    video: "/projects/wardrobe-lab/lucy/02.mp4",
    poster: "/projects/wardrobe-lab/lucy/02.jpg",
  },
  {
    id: "01",
    label: "维京战士盔甲",
    shortLabel: "盔甲",
    video: "/projects/wardrobe-lab/lucy/01.mp4",
    poster: "/projects/wardrobe-lab/lucy/01.jpg",
  },
] as const;

export default function LucyTryOnDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    const videos = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    void Promise.allSettled(videos.map((video) => video.play()));

    const timer = window.setInterval(() => {
      const activeVideo = videoRefs.current[activeIndex];
      if (!activeVideo) return;

      videos.forEach((video) => {
        if (video === activeVideo || video.readyState < 2) return;
        if (Math.abs(video.currentTime - activeVideo.currentTime) > 0.14) {
          video.currentTime = activeVideo.currentTime;
        }
      });
    }, 500);

    return () => window.clearInterval(timer);
  }, [activeIndex]);

  const selectLook = (nextIndex: number) => {
    const currentVideo = videoRefs.current[activeIndex];
    const nextVideo = videoRefs.current[nextIndex];

    if (currentVideo && nextVideo && nextVideo.readyState >= 1) {
      const duration = Number.isFinite(nextVideo.duration)
        ? nextVideo.duration
        : currentVideo.duration;
      nextVideo.currentTime = duration
        ? currentVideo.currentTime % duration
        : currentVideo.currentTime;
      void nextVideo.play();
    }

    setActiveIndex(nextIndex);
  };

  return (
    <figure className={styles.videoDemo}>
      <div className={styles.videoDemoBar}>
        <span>
          <i /> LIVE OUTFIT PREVIEW
        </span>
        <b>点击服装切换</b>
      </div>

      <div className={styles.videoStage}>
        {looks.map((look, index) => (
          <video
            key={look.id}
            ref={(element) => {
              videoRefs.current[index] = element;
            }}
            className={index === activeIndex ? styles.activeVideo : undefined}
            src={look.video}
            poster={look.poster}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label={look.label}
          />
        ))}

        <div className={styles.activeLookLabel} aria-live="polite">
          <span>当前造型</span>
          <b>{looks[activeIndex].label}</b>
        </div>

        <div className={styles.lookPicker} aria-label="选择视频中的服装造型">
          {looks.slice(1).map((look, offset) => {
            const index = offset + 1;
            const isActive = index === activeIndex;

            return (
              <button
                key={look.id}
                type="button"
                className={isActive ? styles.activeLook : undefined}
                aria-label={`切换为${look.label}`}
                aria-pressed={isActive}
                onClick={() => selectLook(index)}
              >
                <Image src={look.poster} alt="" fill sizes="92px" />
                <span>{look.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <figcaption>
        <button
          type="button"
          disabled={activeIndex === 0}
          onClick={() => selectLook(0)}
        >
          ↺ 返回原始画面
        </button>
        <span>同一段动作，点选不同服装即时切换</span>
        <a
          href="https://decart.ai/lucy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Decart Lucy 官方演示素材 ↗
        </a>
      </figcaption>
    </figure>
  );
}
