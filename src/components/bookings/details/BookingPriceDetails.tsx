import { formatCurrency } from '@utils/index';

interface Props {
  pricePerDay: number;
  days: number;
  subtotal: number;
  vatRate: number;
  vat: number;
  total: number;
}

export default function BookingPriceDetails({ pricePerDay, days, subtotal, vatRate, vat, total }: Props) {
  return (
    <div className="booking-price-details">
      <h3>تفاصيل السعر</h3>

      <div className="price-row">
        <span className="value">{formatCurrency(pricePerDay)}</span>
        <span className="label">السعر</span>
      </div>

      <div className="price-row">
        <span className="value">{formatCurrency(subtotal)} <small>{days} × {formatCurrency(pricePerDay)}</small></span>
        <span className="label">المجموع الفرعي</span>
      </div>

      <div className="price-row">
        <span className="value">{formatCurrency(vat)} <small>{vatRate}%</small></span>
        <span className="label">ضريبة القيمة المضافة</span>
      </div>

      <div className="price-row total">
        <span className="value">{formatCurrency(total)}</span>
        <span className="label">الإجمالي</span>
      </div>
    </div>
  );
}