'use client';

import { Dialog } from '@/shared/ui/Dialog';
import './ConfirmDialog.scss';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'default' | 'danger';
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A controlled confirmation dialog for destructive and ordinary decisions. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      className="confirm-dialog"
      closeOnEscape={!pending}
      closeOnBackdrop={!pending}
    >
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      {description && <Dialog.Description>{description}</Dialog.Description>}
      <Dialog.Footer>
        <button type="button" className="confirm-dialog__cancel" disabled={pending} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`confirm-dialog__confirm confirm-dialog__confirm--${tone}`}
          disabled={pending}
          aria-busy={pending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </Dialog.Footer>
    </Dialog>
  );
}
