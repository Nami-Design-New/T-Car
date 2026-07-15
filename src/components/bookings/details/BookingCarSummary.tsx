import Image from 'next/image';
import { formatCurrency } from '@utils/index';
import type { StaticImageData } from 'next/image';

interface Props {
  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;
  showroom: string;
  pricePerDay: number;
  originalPrice?: number;
}

export default function BookingCarSummary({
  carName, carBrand, carImage, showroom, pricePerDay, originalPrice,
}: Props) {
  return (
    <div className="booking-car-summary">
      <div className="booking-car-summary-image">
        <Image src={carImage} alt={carName} fill sizes="72px" />
      </div>

      <div className="booking-car-summary-body">
        <h3>{carBrand} {carName}</h3>
        <span className="showroom">{showroom}</span>
      </div>

      <div className="booking-car-summary-price">
        {originalPrice && <span className="old">{formatCurrency(originalPrice)}</span>}
        <span className="current">{formatCurrency(pricePerDay)}<small>/يوم</small></span>
      </div>
    </div>
  );
}