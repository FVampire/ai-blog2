'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import styles from './moling.module.css';

type ProductWindowProps = {
  src: string;
  alt: string;
  label?: string;
  priority?: boolean;
  className?: string;
};

export default function ProductWindow({ src, alt, label = '墨灵 · 南岸无灯', priority = false, className = '' }: ProductWindowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const sync = () => setMotionAllowed(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!motionAllowed || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.setProperty('--window-x', `${x * 4}px`);
    ref.current.style.setProperty('--window-y', `${y * 3}px`);
    ref.current.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`);
    ref.current.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`);
  }

  function resetPointer() {
    if (!ref.current) return;
    ref.current.style.setProperty('--window-x', '0px');
    ref.current.style.setProperty('--window-y', '0px');
  }

  return (
    <div
      ref={ref}
      className={`${styles.productWindow} ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className={styles.windowChrome} aria-hidden="true">
        <span /><span /><span />
        <b>{label}</b>
        <i>LOCAL · SAVED</i>
      </div>
      <div className={styles.windowMedia}>
        <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 760px) 130vw, (max-width: 1100px) 94vw, 1280px" />
      </div>
    </div>
  );
}
