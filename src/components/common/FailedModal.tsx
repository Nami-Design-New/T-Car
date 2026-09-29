'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';

    // الـ Modal العادي بتاع المحفظة يقفل تلقائي
    // لكن حذف الحساب لا يقفل تلقائياً
    if (!showButtons && onDone) {
      const timer = setTimeout(
        onDone,
        autoCloseDuration
      );

      return () => {
        document.body.style.overflow = '';
        clearTimeout(timer);
      };
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [
    open,
    onDone,
    autoCloseDuration,
    showButtons,
  ]);

  if (!open || !mounted) return null;

  const handleOverlayClick = () => {
    if (showButtons) return;

    onDone?.();
  };

  return createPortal(
    <div
      className="modal_overlay"
      onClick={handleOverlayClick}
    >
      <div
        className={
          showButtons
            ? 'wallet_result_modal delete_account_modal'
            : 'wallet_result_modal'
        }
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <span
          className="wallet_result_drag_handle"
          aria-hidden="true"
        />

        <div
          className="wallet_result_icon wallet_result_icon_failed"
          aria-hidden="true"
        >
          <span />
          <span />
        </div>

        <div className="delete_account_content">
          <h2>{title}</h2>

          {description && (
            <p>{description}</p>
          )}

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
              type="button"
              className="delete_account_cancel"
              disabled={loading}
              onClick={onSecondary}
            >
              {secondaryButtonText}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
