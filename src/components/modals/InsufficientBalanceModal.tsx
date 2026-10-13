'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/shared/ui/Dialog';
import { PAYMENT_ICONS } from '@/shared/config/assets';
const walletIcon = PAYMENT_ICONS.wallet;

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function InsufficientBalanceModal({ open , onClose, onConfirm }: Props) {
  const t = useTranslations('wallet.insufficient');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="insufficient_balance_modal bg-white"
      placement="bottom-sheet"
    >
      <span className="insufficient_balance_drag_handle" aria-hidden="true" />

      <Dialog.Header className="insufficient_balance_header d-flex align-items-center justify-content-between">
        <Dialog.Title className="insufficient_balance_title">{t('title')}</Dialog.Title>
        <Dialog.Close className="insufficient_balance_close btn btn-light d-grid p-0" />
      </Dialog.Header>

      <div className="insufficient_balance_illustration d-flex align-items-center justify-content-center">
        <Image src={walletIcon} alt="" width={150} height={150} />
      </div>

      <div className="insufficient_balance_content text-center">
        <h2>{t('heading')}</h2>
        <p>{t('description')}</p>
      </div>

      <button
        type="button"
        className="insufficient_balance_topup_btn btn w-100"
        onClick={onConfirm}
      >
        {t('topUp')}
      </button>
    </Dialog>
  );
}
