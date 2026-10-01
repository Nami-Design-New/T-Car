'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/shared/ui/Dialog';

import deliveryImg from '@/assets/icons/delivery-car.svg';
import branchImg from '@/assets/icons/branch-car.svg';
import type { PickupType } from '../model';
import './PickupTypeModal.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: PickupType) => void;
}

export default function PickupTypeModal({ open, onClose, onSelect }: Props) {
  const t = useTranslations('rentalSearch.pickup');

  return (
    <Dialog open={open} onClose={onClose} size="lg" className="pickup_modal">
      <Dialog.Close className="close_btn" />

      <div className="modal_header">
        <Dialog.Title>{t('title')}</Dialog.Title>
      </div>

      <div className="pickup_cards">
        <button className="pickup_card" onClick={() => onSelect('delivery')}>
          <Image src={deliveryImg} alt={t('delivery.title')} />

          <h4>{t('delivery.title')}</h4>

          <p>{t('delivery.description')}</p>
        </button>

        <button className="pickup_card" onClick={() => onSelect('branch')}>
          <Image src={branchImg} alt={t('branch.title')} />

          <h4>{t('branch.title')}</h4>

          <p>{t('branch.description')}</p>
        </button>
      </div>
    </Dialog>
  );
}
