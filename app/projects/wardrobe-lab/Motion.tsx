"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

import { motionLooks, motionPath } from "./presentation-data";
import s from "./studio.module.css";

export default function Motion({ live = false }: { live?: boolean }) {
  const [active, setActive] = useState(1);
  const [pending, setPending] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const videos = useRef<Array<HTMLVideoElement | null>>([]);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          preload.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    const viewport = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (container.current) {
      preload.observe(container.current);
      viewport.observe(container.current);
    }
    return () => {
      preload.disconnect();
      viewport.disconnect();
    };
  }, []);

  // Keep buffered video elements mounted. Changing a look never changes a src.
  // Decode the collection together only while on screen; pause every track off screen.
  useEffect(() => {
    const tracks = videos.current;
    tracks.forEach((video) => {
      if (playing && visible && loaded) void video?.play().catch(() => {});
      else video?.pause();
    });
    if (!visible || !loaded) return;
    const sync = window.setInterval(() => {
      const source = tracks[active];
      if (!source || source.readyState < 2 || source.seeking) return;
      tracks.forEach((video) => {
        if (
          !video ||
          video === source ||
          video.readyState < 2 ||
          video.seeking ||
          !Number.isFinite(video.duration)
        )
          return;
        const position = source.currentTime % video.duration;
        if (Math.abs(video.currentTime - position) > 0.15)
          video.currentTime = position;
      });
    }, 250);
    return () => window.clearInterval(sync);
  }, [playing, visible, loaded, active]);

  useEffect(() => {
    if (pending === null) return;
    let frame = 0;
    const deadline = performance.now() + 8000;
    const reveal = () => {
      const source = videos.current[active];
      const target = videos.current[pending];
      if (target?.error || performance.now() > deadline) {
        setFailed(true);
        setPending(null);
        return;
      }
      if (
        target &&
        target.readyState >= 2 &&
        !target.seeking &&
        Number.isFinite(target.duration)
      ) {
        const position = (source?.currentTime || 0) % target.duration;
        if (Math.abs(target.currentTime - position) > 0.12)
          target.currentTime = position;
        else {
          // The old track remains visible until the new track has a decoded, aligned frame.
          setActive(pending);
          setPending(null);
          return;
        }
      }
      frame = requestAnimationFrame(reveal);
    };
    frame = requestAnimationFrame(reveal);
    return () => cancelAnimationFrame(frame);
  }, [pending, active]);

  const capture = () => {
    const video = videos.current[active];
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const link = document.createElement("a");
    link.download = "wardrobe-frame.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  return (
    <div ref={container} className={s.motion}>
      <div className={s.motionScreen}>
        {motionLooks.map((look, index) => (
          <video
            key={look.id}
            ref={(element) => {
              videos.current[index] = element;
            }}
            className={
              index === active ? s.motionTrackActive : s.motionTrackHidden
            }
            aria-hidden={index !== active}
            aria-label={look.name}
            src={loaded ? motionPath(look.id) : undefined}
            poster={motionPath(look.id, "jpg")}
            muted
            playsInline
            loop
            preload="auto"
            onCanPlay={() => {
              if (playing && visible)
                void videos.current[index]?.play().catch(() => {});
            }}
            onTimeUpdate={() => {
              const video = videos.current[index];
              if (index === active && video)
                setProgress((video.currentTime / (video.duration || 1)) * 100);
            }}
            onError={() => {
              if (index === active) setFailed(true);
            }}
          />
        ))}
        <div className={s.motionHud}>
          <span>
            <i /> {live ? "LIVE SESSION" : "MOTION STUDIO"}
          </span>
          <span>IDENTITY LOCK ON</span>
        </div>
        <div className={s.motionBottom}>
          <b>
            {motionLooks[active].name}
            <small> / MOTION COLLECTION</small>
          </b>
          <button
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? "暂停视频" : "播放视频"}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
        </div>
        {failed && <p className={s.videoError}>视频加载失败，请切换造型重试</p>}
      </div>
      <div className={s.videoProgress}>
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className={s.motionControls}>
        <div>
          {motionLooks.map((look, index) => (
            <button
              key={look.id}
              aria-pressed={active === index}
              aria-busy={pending === index}
              onClick={() => {
                setFailed(false);
                setPending(index === active ? null : index);
              }}
            >
              <img src={motionPath(look.id, "jpg")} alt="" loading="lazy" />
              <span>{look.name}</span>
            </button>
          ))}
        </div>
        <button className={s.outlineButton} onClick={capture}>
          截取画面 ↗
        </button>
      </div>
    </div>
  );
}
