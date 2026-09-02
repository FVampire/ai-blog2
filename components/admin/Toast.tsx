'use client';

import React, { useEffect, useState } from 'react';

import styles from './Toast.module.css';

export type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

type Listener = (items: ToastItem[]) => void;

const SUCCESS_DISMISS_MS = 3000;
const ERROR_DISMISS_MS = 6000;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];
let nextId = 1;

function emit() {
  const snapshot = [...items];
  listeners.forEach((listener) => listener(snapshot));
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(type: ToastType, message: string) {
  if (!message) return;

  const id = nextId++;
  items = [...items, { id, type, message }];
  emit();
  window.setTimeout(
    () => dismiss(id),
    type === 'error' ? ERROR_DISMISS_MS : SUCCESS_DISMISS_MS,
  );
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
};

export default function ToastContainer() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (next) => setList(next);
    listeners.add(listener);
    setList([...items]);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className={styles.stack} aria-label="系统通知">
      {list.map((item) => (
        <div
          key={item.id}
          className={`${styles.toast} ${item.type === 'success' ? styles.success : styles.error}`}
          role={item.type === 'error' ? 'alert' : 'status'}
          aria-atomic="true"
        >
          <span className={styles.icon} aria-hidden="true">
            {item.type === 'success' ? '✓' : '!'}
          </span>
          <span className={styles.message}>{item.message}</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => dismiss(item.id)}
            aria-label="关闭提示"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
