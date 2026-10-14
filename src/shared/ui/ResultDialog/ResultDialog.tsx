'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from '@/shared/ui/Dialog';
import { RESULT_ANIMATIONS } from '@/shared/config/assets';
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

/** A controlled success/error notice with an optional action and auto-close. */
export function ResultDialog({
  open,
  status,
  title,
  description,
  action,
  autoCloseMs = 2000,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open || autoCloseMs <= 0) return;
    const timeout = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timeout);
  }, [autoCloseMs, onClose, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="result-dialog"
      placement="bottom-sheet"
      closeOnBackdrop
    >
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body className="result-dialog__body">
        <Image
          className="result-dialog__animation"
          src={RESULT_ANIMATIONS[status]}
          alt=""
          width={180}
          height={180}
          unoptimized
        />
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
