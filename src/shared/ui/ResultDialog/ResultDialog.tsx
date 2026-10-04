'use client';

import { useEffect } from 'react';
import { Dialog } from '@/shared/ui/Dialog';
import './ResultDialog.scss';

export interface Props {
  open: boolean;
  status: 'success' | 'error';
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  autoCloseMs?: number;
  onClose: () => void;
}

/** A controlled success/error notice with an optional action or auto-close. */
export function ResultDialog({
  open,
  status,
  title,
  description,
  action,
  autoCloseMs,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open || !autoCloseMs) return;
    const timeout = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timeout);
  }, [autoCloseMs, onClose, open]);

  return (
    <Dialog open={open} onClose={onClose} className="result-dialog" placement="bottom-sheet">
      <Dialog.Body className="result-dialog__body">
        <span className={`result-dialog__icon result-dialog__icon--${status}`} aria-hidden="true">
          {status === 'success' ? '✓' : '×'}
        </span>
        <Dialog.Title>{title}</Dialog.Title>
        {description && <Dialog.Description>{description}</Dialog.Description>}
        {action && (
          <button type="button" className="result-dialog__action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </Dialog.Body>
    </Dialog>
  );
}
