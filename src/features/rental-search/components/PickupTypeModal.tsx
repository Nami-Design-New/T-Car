'use client';

import Image from 'next/image';
import { FiX, FiArrowLeft } from 'react-icons/fi';

import deliveryImg from '@/assets/icons/delivery-car.svg';
import branchImg from '@/assets/icons/branch-car.svg';
import type { PickupType } from '../model';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: PickupType) => void;
}

export default function PickupTypeModal({
  open,
  onClose,
  onSelect,
}: Props) {
  if (!open) return null;

  return (
    <div className="modal_overlay">

      <div className="pickup_modal">

        <button
          className="close_btn"
          onClick={onClose}
        >
          <FiX />
        </button>

        <div className="modal_header">

          <h2>اختر نوع الإستلام</h2>

        

        </div>

        <div className="pickup_cards">

          <button
            className="pickup_card"
            onClick={() => onSelect('delivery')}
          >
            <Image
              src={deliveryImg}
              alt="Delivery"
            />

            <h4>نوصل لمكانك</h4>

            <p>
              استلم السيارة أمام منزلك أو موقعك
            </p>

          </button>

          <button
            className="pickup_card"
            onClick={() => onSelect('branch')}
          >
            <Image
              src={branchImg}
              alt="Branch"
            />

            <h4>استلام من الفرع</h4>

            <p>
              استلم السيارة من أقرب فرع لك
            </p>

          </button>

        </div>

      </div>

    </div>
  );
}