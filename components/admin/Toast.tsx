'use client';

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

type Listener = (items: ToastItem[]) => void;

const AUTO_DISMISS_MS = 3000;

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
  window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
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
    <div className="admin-toast-stack">
      {list.map((item) => (
        <div key={item.id} className={`admin-toast admin-toast-${item.type}`} role="status">
          <span className="admin-toast-icon">{item.type === 'success' ? '✓' : '!'}</span>
          <span className="admin-toast-message">{item.message}</span>
          <button
            type="button"
            className="admin-toast-close"
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
