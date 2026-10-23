'use client';

import { Dialog } from '@/shared/ui/Dialog';
import { cn } from '@/shared/lib/cn';

export interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  error?: string;
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
  error,
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
      {error && (
        <p className="confirm-dialog__error mx-6 text-sm text-status-error" role="alert">
          {error}
        </p>
      )}
      <Dialog.Footer>
        <button
          type="button"
          className="confirm-dialog__cancel min-h-11 cursor-pointer rounded-md border border-stroke-light bg-surface-elevated px-5 font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-[0.55]"
          disabled={pending}
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={cn(
            'confirm-dialog__confirm min-h-11 cursor-pointer rounded-md border-0 bg-action-primary px-5 font-semibold text-text-on-action disabled:cursor-not-allowed disabled:opacity-[0.55]',
            tone === 'danger' && 'confirm-dialog__confirm--danger bg-status-error',
          )}
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
