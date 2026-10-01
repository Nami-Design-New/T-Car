'use client';

import Image from 'next/image';
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
  return (
    <Dialog open={open} onClose={onClose} size="lg" className="pickup_modal">
      <Dialog.Close className="close_btn" />

      <div className="modal_header">
        <Dialog.Title>اختر نوع الإستلام</Dialog.Title>
      </div>

      <div className="pickup_cards">
        <button className="pickup_card" onClick={() => onSelect('delivery')}>
          <Image src={deliveryImg} alt="Delivery" />

          <h4>نوصل لمكانك</h4>

          <p>استلم السيارة أمام منزلك أو موقعك</p>
        </button>

        <button className="pickup_card" onClick={() => onSelect('branch')}>
          <Image src={branchImg} alt="Branch" />

          <h4>استلام من الفرع</h4>

          <p>استلم السيارة من أقرب فرع لك</p>
        </button>
      </div>
    </Dialog>
  );
}
