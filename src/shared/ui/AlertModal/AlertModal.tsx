'use client';

import { useEffect, useRef } from 'react';
import { Dialog } from '@/shared/ui/Dialog';
import './AlertModal.scss';

export interface Props {
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

/** The failure/confirmation surface used for account deletion. */
export function AlertModal({
  open,
  title,
  description,
  onDone,
  autoCloseDuration = 2000,
  showButtons = false,
  primaryButtonText = 'Confirm',
  secondaryButtonText = 'Cancel',
  loading = false,
  error,
  onPrimary,
  onSecondary,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const hasOnDone = !!onDone;

  useEffect(() => {
    if (!open || showButtons || !hasOnDone) return;

    const timer = setTimeout(() => onDoneRef.current?.(), autoCloseDuration);
    return () => clearTimeout(timer);
  }, [open, hasOnDone, autoCloseDuration, showButtons]);

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
          <p className="text-status-error text-sm mt-2 mb-0" role="alert">
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
