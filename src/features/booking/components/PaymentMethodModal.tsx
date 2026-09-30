'use client';

import { useEffect, useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { RadioCards } from '@/shared/ui/RadioCards';
import type { PaymentMethod } from '../model';
import walletIcon from '@assets/icons/Wallet.svg';
import cardIcon from '@assets/card.svg';
import tabyIcon from '@assets/taby.svg';
import tamaraIcon from '@assets/tamara.svg';
import riyalIcon from '@assets/icons/sar.svg';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  loading?: boolean;
  /** Already translated; the dialog stays open and shows it after a failed submit. */
  error?: string;
}

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  description: string;
  icon: StaticImageData;
  iconAlt: string;
  iconWidth: number;
  iconHeight: number;
}

const OPTIONS: PaymentOption[] = [
  {
    id: 'visa',
    title: 'دفع الكتروني ( فيزا / ماستركارد )',
    description: 'دعم مدي , فيزا , ماستركارد من اي مكان بالعالم',
    icon: cardIcon,
    iconAlt: '',
    iconWidth: 24,
    iconHeight: 24,
  },
  {
    id: 'tabby',
    title: 'ادفع لاحقاً عبر تـابي',
    description: 'قسم فاتورتك على 4 دفعات بدون فوائد',
    icon: tabyIcon,
    iconAlt: 'تابي',
    iconWidth: 58,
    iconHeight: 24,
  },
  {
    id: 'tamara',
    title: 'ادفع لاحقاً عبر تمـارا',
    description: 'ادفع على 3 دفعات مريحة ومتوافقة مع الشريعة',
    icon: tamaraIcon,
    iconAlt: 'تمارا',
    iconWidth: 66,
    iconHeight: 24,
  },
];

export default function PaymentMethodModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  error,
}: Props) {
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
      <div className="payment_method_modal bg-white" onClick={(e) => e.stopPropagation()}>
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
          <RadioCards.Root
            value={method}
            onValueChange={(value) => setMethod(value as PaymentMethod)}
            aria-label="طريقة الدفع"
            className="d-flex flex-column gap-3"
          >
            <RadioCards.Item
              value="wallet"
              className={`payment_modal_option d-flex align-items-center justify-content-between gap-3 ${method === 'wallet' ? 'selected' : ''}`}
            >
              <span className="payment_option_text d-flex flex-column">
                <span className="payment_option_title">المحفظة</span>
                <span className="payment_option_desc">ادفع بالمحفظة بطريقة اسرع</span>
              </span>
              <span className="payment_option_info d-flex align-items-center gap-2">
                <Image src={walletIcon} alt="" width={24} height={24} />
                <strong className="d-flex align-items-center gap-1">
                  500
                  <Image src={riyalIcon} alt="ريال" width={14} height={14} />
                </strong>
              </span>
            </RadioCards.Item>

            {OPTIONS.map((option) => (
              <RadioCards.Item
                key={option.id}
                value={option.id}
                className={`payment_modal_option d-flex align-items-center justify-content-between gap-3 ${method === option.id ? 'selected' : ''}`}
              >
                <span className="payment_option_text d-flex flex-column">
                  <span className="payment_option_title">{option.title}</span>
                  <span className="payment_option_desc">{option.description}</span>
                </span>
                <span className="payment_option_info d-flex align-items-center">
                  <Image
                    src={option.icon}
                    alt={option.iconAlt}
                    width={option.iconWidth}
                    height={option.iconHeight}
                  />
                </span>
              </RadioCards.Item>
            ))}
          </RadioCards.Root>

          <label className="payment_modal_option d-flex align-items-center justify-content-between gap-3">
            <span className="payment_option_text d-flex flex-column">
              <span className="payment_option_title">استخدم النقاط</span>
              <span className="payment_option_desc">وفر وادفع بالنقاط اللي ليك</span>
            </span>
            <span className="points_info d-flex align-items-center gap-3">
              <span className="form-check form-switch m-0 p-0">
                <input
                  className="form-check-input m-0"
                  type="checkbox"
                  role="switch"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                />
              </span>
              <span className="points_value d-flex flex-column" dir="rtl">
                <small>
                  حتي <strong>100 نقطة</strong>
                </small>
                <span className="points_amount d-flex align-items-center gap-1">
                  <span>=</span>
                  <strong>500</strong>
                  <Image src={riyalIcon} alt="ريال" width={12} height={12} />
                </span>
              </span>
            </span>
          </label>
        </div>

        {error && (
          <p className="text-danger small mt-3 mb-0" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="payment_confirm_btn btn btn-primary w-100 mt-3"
          onClick={() => onConfirm(method)}
          disabled={loading}
        >
          {loading ? 'جاري تأكيد الحجز...' : 'تأكيد'}
        </button>
      </div>
    </div>,
    document.body
  );
}
