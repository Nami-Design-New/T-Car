'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { formatAmount } from '@utils/index';
import sarIcon from '@assets/icons/sar.svg';

interface Props {
  open: boolean;
  title: string;
  submitLabel: string;
  min: number;
  max?: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

/** Amount entry sheet shared by wallet top-up and withdraw. */
export default function WalletAmountModal({
  open,
  title,
  submitLabel,
  min,
  max,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
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

  const value = Number(amount);
  const aboveMax = max !== undefined && value > max;
  const valid = amount !== '' && value >= min && !aboveMax;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valid && !loading) onConfirm(value);
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return createPortal(
    <div className="modal_overlay" onClick={handleClose}>
      <div className="wallet_topup_modal bg-white" onClick={(event) => event.stopPropagation()}>
        <span className="wallet_topup_drag_handle" aria-hidden="true" />

        <div className="wallet_topup_header d-flex align-items-center justify-content-between">
          <h3 className="m-0">{title}</h3>
          <button
            type="button"
            className="wallet_topup_close btn btn-light d-grid p-0"
            onClick={handleClose}
            aria-label="إغلاق"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={`wallet_topup_input_group ${aboveMax ? 'invalid' : ''}`}>
            <Image src={sarIcon} alt="" width={18} height={18} className="currency_icon" />
            <input
              type="number"
              min={min}
              max={max}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="00"
              aria-label={title}
              required
              autoFocus
            />
          </div>
          <small className={`wallet_topup_hint ${aboveMax ? 'invalid' : ''}`}>
            الحد الأدنى {formatAmount(min)} ريال
            {max !== undefined && ` - الحد الأقصى ${formatAmount(max)} ريال`}
          </small>
          <button type="submit" className="wallet_topup_submit btn w-100" disabled={!valid || loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-label="جاري التنفيذ" />
            ) : (
              submitLabel
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
