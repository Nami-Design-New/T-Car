'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import type { PaymentMethod } from '@app-types/car';
import walletIcon from '@assets/icons/Wallet.svg';
import visaIcon from '@assets/icons/Payment.svg';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
}

export default function PaymentMethodModal({ open, onClose, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('wallet');
  const [usePoints, setUsePoints] = useState(false);
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
      <div className="payment_method_modal bg-white" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <span className="payment_drag_handle" />

        <div className="payment_modal_header d-flex align-items-center justify-content-between mb-3">
          <h3>طريقة الدفع</h3>
          <button
            type="button"
            className="payment_modal_close btn btn-light d-grid p-0"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <FiX />
          </button>
        </div>

        <div className="payment_modal_options d-flex flex-column gap-3">
          <label
            className={`payment_modal_option d-flex align-items-center justify-content-between ${method === 'wallet' ? 'selected' : ''}`}
          >
            <input
              className="visually-hidden"
              type="radio"
              name="payment"
              checked={method === 'wallet'}
              onChange={() => setMethod('wallet')}
            />
            <span className="payment_option_title">المحفظة</span>
            <span className="payment_option_info d-flex align-items-center gap-2">
              <Image src={walletIcon} alt="" width={20} height={20} />
              <strong>500 ر.س</strong>
            </span>
          </label>

          <label
            className={`payment_modal_option d-flex align-items-center justify-content-between ${method === 'visa' ? 'selected' : ''}`}
          >
            <input
              className="visually-hidden"
              type="radio"
              name="payment"
              checked={method === 'visa'}
              onChange={() => setMethod('visa')}
            />
            <span className="payment_option_title">دفع إلكتروني</span>
            <span className="payment_option_info d-flex align-items-center gap-2">
              <Image src={visaIcon} alt="" width={30} height={20} />
            </span>
          </label>

          <label className="payment_modal_option d-flex align-items-center justify-content-between">
            <span className="payment_option_title">استخدام النقاط</span>
            <span className="points_info d-flex align-items-center gap-2">
              <span className="form-check form-switch m-0 p-0">
                <input
                  className="form-check-input m-0"
                  type="checkbox"
                  role="switch"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                />
              </span>
              <small>
                حتى <strong>100 نقطة</strong> متاحة
              </small>
            </span>
          </label>
        </div>

        <button
          type="button"
          className="payment_confirm_btn btn btn-primary w-100 mt-2"
          onClick={() => onConfirm(method)}
        >
          تأكيد
        </button>
      </div>
    </div>,
    document.body
  );
}
