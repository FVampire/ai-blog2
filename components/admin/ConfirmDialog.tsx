'use client';

import { useCallback, useRef, useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  dangerous?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, description, confirmLabel = '确认', dangerous = false, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <div className="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-dialog-title" aria-describedby="admin-dialog-description">
        <h2 id="admin-dialog-title">{title}</h2>
        <p id="admin-dialog-description">{description}</p>
        <div className="admin-dialog-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>取消</button>
          <button type="button" className={dangerous ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>{busy ? '处理中...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  dangerous?: boolean;
}

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((nextOptions: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setOptions(nextOptions);
  }), []);

  const close = (confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setOptions(null);
  };

  return {
    confirm,
    confirmDialog: (
      <ConfirmDialog
        open={Boolean(options)}
        title={options?.title || ''}
        description={options?.description || ''}
        confirmLabel={options?.confirmLabel}
        dangerous={options?.dangerous}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    ),
  };
}
