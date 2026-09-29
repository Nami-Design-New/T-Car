'use client';

import { type FormEvent, useRef, useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@/shared/ui/Dialog';
import { formatAmount } from '@/shared/lib/format';
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

/** Amount entry sheet shared by wallet top-up and withdrawal. */
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
  const inputRef = useRef<HTMLInputElement>(null);
  const value = Number(amount);
  const aboveMax = max !== undefined && value > max;
  const valid = amount !== '' && value >= min && !aboveMax;
  const hintId = 'wallet-amount-hint';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valid && !loading) onConfirm(value);
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="wallet_topup_modal"
      placement="bottom-sheet"
      initialFocusRef={inputRef}
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <span className="wallet_topup_drag_handle" aria-hidden="true" />
      <Dialog.Header className="wallet_topup_header d-flex align-items-center justify-content-between">
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Close className="wallet_topup_close btn btn-light d-grid p-0" />
      </Dialog.Header>

      <Dialog.Body className="wallet_topup_body">
        <form onSubmit={handleSubmit}>
          <div className={`wallet_topup_input_group ${aboveMax ? 'invalid' : ''}`}>
            <Image src={sarIcon} alt="" width={18} height={18} className="currency_icon" />
            <input
              ref={inputRef}
              type="number"
              min={min}
              max={max}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="00"
              aria-label={title}
              aria-describedby={hintId}
              required
            />
          </div>
          <small id={hintId} className={`wallet_topup_hint ${aboveMax ? 'invalid' : ''}`}>
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
      </Dialog.Body>
    </Dialog>
  );
}
