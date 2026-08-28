'use client';

import { useEffect, useRef, useState } from 'react';
import { copyText } from '@/lib/tools/clipboard';
import styles from './tools-shared.module.css';

export default function CopyButton({
  value,
  label = '复制',
  small = false,
  primary = false,
}: {
  value: string;
  label?: string;
  small?: boolean;
  primary?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const className = [
    styles.button,
    small ? styles.buttonSmall : '',
    primary ? styles.buttonPrimary : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={className}
      disabled={!value}
      onClick={async () => {
        await copyText(value);
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? '已复制' : label}
    </button>
  );
}
