'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import walletIcon from '@assets/icons/Wallet.svg';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function InsufficientBalanceModal({ open , onClose, onConfirm }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="modal_overlay" onClick={onClose}>
      <div
        className="insufficient_balance_modal bg-white"
        dir="rtl"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="insufficient_balance_drag_handle" aria-hidden="true" />

        <div className="insufficient_balance_header d-flex align-items-center justify-content-between">
          <h3 className="m-0">رصيدك غير كافي</h3>
          <button
            type="button"
            className="insufficient_balance_close btn btn-light d-grid p-0"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <FiX />
          </button>
        </div>

        <div className="insufficient_balance_illustration d-flex align-items-center justify-content-center">
          <Image src={walletIcon} alt="" width={150} height={150} />
        </div>

        <div className="insufficient_balance_content text-center">
          <h2>الرصيد منخفض للغاية</h2>
          <p>يرجى شحن رصيد محفظتك لكي تتمكن من الدفع بالمحفظة</p>
        </div>

        <button
          type="button"
          className="insufficient_balance_topup_btn btn w-100"
          onClick={onConfirm}
        >
          اشحن الآن
        </button>
      </div>
    </div>,
    document.body
  );
}
