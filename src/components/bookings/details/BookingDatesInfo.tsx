import { FiCalendar, FiInfo } from 'react-icons/fi';

interface Props {
  pickupDateTime: string;
  dropoffDateTime: string;
  warrantyNote: string;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' });
  return `${date} - ${time}`;
}

export default function BookingDatesInfo({ pickupDateTime, dropoffDateTime, warrantyNote }: Props) {
  return (
    <div className="booking-dates-info">
      <div className="date-columns">
        <div className="date-row">
          <span className="icon"><FiCalendar /></span>
          <div>
            <span className="label">موعد الاستلام</span>
            <span className="value">{formatDateTime(pickupDateTime)}</span>
          </div>
        </div>

        <div className="date-row">
          <span className="icon"><FiCalendar /></span>
          <div>
            <span className="label">موعد التسليم</span>
            <span className="value">{formatDateTime(dropoffDateTime)}</span>
          </div>
        </div>
      </div>

      <div className="warranty-note">
        <FiInfo />
        <span>{warrantyNote}</span>
      </div>
    </div>
  );
}
