'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  title?: string;
  onDone?: () => void;
  autoCloseDuration?: number;
}

export default function FailedModal({
  open,
  title = 'فشل في عملية الشحن',
  onDone,
  autoCloseDuration = 2000,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const timer = onDone ? setTimeout(onDone, autoCloseDuration) : undefined;
    return () => {
      document.body.style.overflow = '';
      if (timer) clearTimeout(timer);
    };
  }, [open, onDone, autoCloseDuration]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="modal_overlay" onClick={onDone}>
      <div className="wallet_result_modal" dir="rtl" onClick={(event) => event.stopPropagation()}>
        <span className="wallet_result_drag_handle" aria-hidden="true" />
        <div className="wallet_result_icon wallet_result_icon_failed" aria-hidden="true">
          <span />
          <span />
        </div>
        <h2>{title}</h2>
      </div>
    </div>,
    document.body
  );
}
