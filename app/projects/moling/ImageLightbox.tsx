'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import styles from './moling.module.css';

type ImageLightboxProps = {
  alt: string;
  label: string;
  src: string;
};

export default function ImageLightbox({ alt, label, src }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ left: number; top: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if ((event.key === '+' || event.key === '=') && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setZoom((value) => Math.min(2.5, Number((value + 0.25).toFixed(2))));
      }
      if (event.key === '-' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setZoom(1);
  }

  function changeZoom(next: number) {
    setZoom(Math.min(2.5, Math.max(1, Number(next.toFixed(2)))));
  }

  return (
    <>
      <button type="button" className={styles.fullImageButton} onClick={() => setOpen(true)} aria-label={`在页面内放大：${label}`}>
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 68vw" />
        <span className={styles.zoomHint}>点击放大 · 站内查看</span>
      </button>

      {open && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={`${label} 完整截图`}>
          <button type="button" className={styles.lightboxBackdrop} onClick={close} aria-label="关闭图片预览" />
          <div className={styles.lightboxPanel}>
            <div className={styles.lightboxToolbar}>
              <div><b>{label}</b><span>原始截图 · {Math.round(zoom * 100)}%</span></div>
              <div>
                <button type="button" onClick={() => changeZoom(zoom - 0.25)} disabled={zoom <= 1} aria-label="缩小图片">−</button>
                <button type="button" onClick={() => changeZoom(1)} disabled={zoom === 1}>重置</button>
                <button type="button" onClick={() => changeZoom(zoom + 0.25)} disabled={zoom >= 2.5} aria-label="放大图片">＋</button>
                <button type="button" onClick={close}>关闭</button>
              </div>
            </div>
            <div
              ref={viewportRef}
              className={`${styles.lightboxViewport} ${zoom > 1 ? styles.lightboxViewportZoomed : ''}`}
              onPointerDown={(event) => {
                if (zoom <= 1 || !viewportRef.current) return;
                dragRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  left: viewportRef.current.scrollLeft,
                  top: viewportRef.current.scrollTop,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!dragRef.current || !viewportRef.current) return;
                viewportRef.current.scrollLeft = dragRef.current.left - (event.clientX - dragRef.current.x);
                viewportRef.current.scrollTop = dragRef.current.top - (event.clientY - dragRef.current.y);
              }}
              onPointerUp={() => { dragRef.current = null; }}
              onPointerCancel={() => { dragRef.current = null; }}
            >
              <Image
                src={src}
                alt={alt}
                width={1600}
                height={1000}
                unoptimized
                draggable={false}
                style={{ width: `${zoom * 100}%`, height: 'auto', maxWidth: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
