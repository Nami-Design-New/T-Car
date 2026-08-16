'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export default function WalletTopUpModal({ open, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    setAmount('');
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (value > 0) onConfirm(value);
  };

  return createPortal(
    <div className="modal_overlay" onClick={onClose}>
      <div className="wallet_topup_modal bg-white" dir="rtl" onClick={(event) => event.stopPropagation()}>
        <span className="wallet_topup_drag_handle" aria-hidden="true" />

        <div className="wallet_topup_header d-flex align-items-center justify-content-between">
          <h3 className="m-0">اشحن المحفظة</h3>
          <button type="button" className="wallet_topup_close btn btn-light d-grid p-0" onClick={onClose} aria-label="إغلاق">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="wallet_topup_input_group">
            <span aria-hidden="true">﷼</span>
            <input
              type="number"
              min="1"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="00"
              aria-label="مبلغ الشحن"
              required
            />
          </div>
          <small className="wallet_topup_hint">الحد الأدنى 10 ريال</small>
          <button type="submit" className="wallet_topup_submit btn w-100">شحن</button>
        </form>
      </div>
    </div>,
    document.body
  );
}
