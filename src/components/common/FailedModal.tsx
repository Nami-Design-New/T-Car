'use client';

import { useEffect, useRef } from 'react';
import { Dialog } from '@/shared/ui/Dialog';
import './FailedModal.scss';

interface Props {
  open: boolean;

  title?: string;
  description?: string;

  onDone?: () => void;

  autoCloseDuration?: number;

  showButtons?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  loading?: boolean;
  error?: string;

  onPrimary?: () => void | Promise<void>;
  onSecondary?: () => void;
}

export default function FailedModal({
  open,
  title = 'فشل في عملية الشحن',
  description,

  onDone,

  autoCloseDuration = 2000,

  showButtons = false,
  primaryButtonText = 'تأكيد',
  secondaryButtonText = 'إلغاء',
  loading = false,
  error,

  onPrimary,
  onSecondary,
}: Props) {
  // The confirmation opens on its safe choice, so Enter does not run the destructive one.
  const cancelRef = useRef<HTMLButtonElement>(null);

  // The latest onDone, so a caller that passes a new function on every render does not restart
  // the auto-close timer.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const hasOnDone = !!onDone;

  // A plain result closes itself; the confirmation (showButtons) waits for a choice.
  useEffect(() => {
    if (!open || showButtons || !hasOnDone) return;

    const timer = setTimeout(() => onDoneRef.current?.(), autoCloseDuration);
    return () => clearTimeout(timer);
  }, [open, hasOnDone, autoCloseDuration, showButtons]);

  // Escape (and, for a plain result, the backdrop) means "done" or "cancel".
  const handleClose = () => {
    if (showButtons) {
      if (!loading) onSecondary?.();
      return;
    }

    onDone?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="sm"
      className={showButtons ? 'wallet_result_modal delete_account_modal' : 'wallet_result_modal'}
      closeOnEscape={!loading}
      // closeOnBackdrop={!showButtons}
      initialFocusRef={showButtons ? cancelRef : undefined}
    >
      <div className="wallet_result_icon wallet_result_icon_failed" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="delete_account_content">
        {title && <Dialog.Title>{title}</Dialog.Title>}
        {description && <Dialog.Description>{description}</Dialog.Description>}

        {error && (
          <p className="text-danger small mt-2 mb-0" role="alert">
            {error}
          </p>
        )}
      </div>

      {showButtons && (
        <div className="delete_account_actions">
          <button
            type="button"
            className="delete_account_confirm"
            disabled={loading}
            aria-busy={loading}
            onClick={onPrimary}
          >
            {primaryButtonText}
          </button>

          <button
            ref={cancelRef}
            type="button"
            className="delete_account_cancel"
            disabled={loading}
            onClick={onSecondary}
          >
            {secondaryButtonText}
          </button>
        </div>
      )}
    </Dialog>
  );
}
