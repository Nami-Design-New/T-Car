'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { RadioCards } from '@/shared/ui/RadioCards';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import type { PaymentMethod } from '../model';
import { ICONS, PAYMENT_ICONS } from '@/shared/config/assets';
const walletIcon = PAYMENT_ICONS.wallet;
const cardIcon = PAYMENT_ICONS.card;
const tabyIcon = PAYMENT_ICONS.tabby;
const tamaraIcon = PAYMENT_ICONS.tamara;
const riyalIcon = ICONS.riyal;

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
  icon: { src: string; width: number; height: number };
  iconAlt: string;
  iconWidth: number;
  iconHeight: number;
}

const OPTIONS: PaymentOption[] = [
  {
    id: 'visa',
    title: 'visa.title',
    description: 'visa.description',
    icon: cardIcon,
    iconAlt: '',
    iconWidth: 24,
    iconHeight: 24,
  },
  {
    id: 'tabby',
    title: 'tabby.title',
    description: 'tabby.description',
    icon: tabyIcon,
    iconAlt: '',
    iconWidth: 58,
    iconHeight: 24,
  },
  {
    id: 'tamara',
    title: 'tamara.title',
    description: 'tamara.description',
    icon: tamaraIcon,
    iconAlt: '',
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
  const t = useTranslations('booking.payment');
  const [method, setMethod] = useState<PaymentMethod>('wallet');
  const [usePoints, setUsePoints] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} placement="bottom-sheet" label={t('dialogLabel')}>
      <div className="payment_method_modal bg-white">
        <span className="payment_drag_handle" />

        <Dialog.Header className="payment_modal_header flex items-center justify-between mb-4">
          <Dialog.Title>{t('title')}</Dialog.Title>
          <Dialog.Close className="payment_modal_close btn bg-transparent grid p-0" />
        </Dialog.Header>

        <div className="payment_modal_options flex flex-col gap-4">
          <RadioCards.Root
            value={method}
            onValueChange={(value) => setMethod(value as PaymentMethod)}
            aria-label={t('title')}
            className="flex flex-col gap-4"
          >
            <RadioCards.Item
              value="wallet"
              className={`payment_modal_option flex items-center justify-between gap-4 ${method === 'wallet' ? 'selected' : ''}`}
            >
              <span className="payment_option_text flex flex-col">
                <span className="payment_option_title">{t('wallet')}</span>
                <span className="payment_option_desc">{t('walletDescription')}</span>
              </span>
              <span className="payment_option_info flex items-center gap-2">
                <Image src={walletIcon} alt="" width={24} height={24} />
                <strong className="flex items-center gap-1">
                  500
                  <Image src={riyalIcon} alt={t('currency')} width={14} height={14} />
                </strong>
              </span>
            </RadioCards.Item>

            {OPTIONS.map((option) => (
              <RadioCards.Item
                key={option.id}
                value={option.id}
                className={`payment_modal_option flex items-center justify-between gap-4 ${method === option.id ? 'selected' : ''}`}
              >
                <span className="payment_option_text flex flex-col">
                  <span className="payment_option_title">{t(`options.${option.id}.title`)}</span>
                  <span className="payment_option_desc">
                    {t(`options.${option.id}.description`)}
                  </span>
                </span>
                <span className="payment_option_info flex items-center">
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

          <label className="payment_modal_option flex items-center justify-between gap-4">
            <span className="payment_option_text flex flex-col">
              <span className="payment_option_title">{t('points')}</span>
              <span className="payment_option_desc">{t('pointsDescription')}</span>
            </span>
            <span className="points_info flex items-center gap-4">
              <span className="points-switch">
                <input
                  className="points-switch-input"
                  type="checkbox"
                  role="switch"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                />
              </span>
              <span className="points_value flex flex-col" dir="rtl">
                <small>
                  {t('upTo')} <strong>100 {t('pointsUnit')}</strong>
                </small>
                <span className="points_amount flex items-center gap-1">
                  <span>=</span>
                  <strong>500</strong>
                  <Image src={riyalIcon} alt={t('currency')} width={12} height={12} />
                </span>
              </span>
            </span>
          </label>
        </div>

        {error && (
          <p className="text-status-error text-sm mt-4 mb-0" role="alert">
            {error}
          </p>
        )}

        <Button
          type="button"
          className="payment_confirm_btn w-full mt-4"
          onClick={() => onConfirm(method)}
          loading={loading}
        >
          {loading ? t('confirming') : t('confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
