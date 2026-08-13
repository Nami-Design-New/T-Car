import {
  FiCalendar,
  FiMapPin,
  FiInfo,
} from 'react-icons/fi';

interface Props {
  pickupLocation: string;
  dropoffLocation: string;

  pickupDateTime: string;
  dropoffDateTime: string;

  warrantyNote: string;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);

  const date = d.toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const time = d.toLocaleTimeString('ar-SA', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${date} - ${time}`;
}

export default function BookingDatesInfo({
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
  dropoffDateTime,
  warrantyNote,
}: Props) {
  return (
    <div className="booking-dates-info">

      {/* Location */}
      <div className="info-section">
        <h3>الموقع</h3>

        <div className="info-row">
          <span className="icon">
            <FiMapPin />
          </span>

          <div>
            <span className="label">
              عنوان الاستلام
            </span>

            <span className="value">
              {pickupLocation}
            </span>
          </div>
        </div>

        <div className="info-row">
          <span className="icon">
            <FiMapPin />
          </span>

          <div>
            <span className="label">
              عنوان التسليم
            </span>

            <span className="value">
              {dropoffLocation}
            </span>
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="info-section">
        <h3>التاريخ</h3>

        <div className="info-row">
          <span className="icon">
            <FiCalendar />
          </span>

          <div>
            <span className="label">
              موعد الاستلام
            </span>

            <span className="value">
              {formatDateTime(pickupDateTime)}
            </span>
          </div>
        </div>

        <div className="info-row">
          <span className="icon">
            <FiCalendar />
          </span>

          <div>
            <span className="label">
              موعد التسليم
            </span>

            <span className="value">
              {formatDateTime(dropoffDateTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Additional details */}
      <div className="warranty-note">
        <FiInfo />
        <div>
          <span className="label">
            تفاصيل إضافية
          </span>

          <span>
            {warrantyNote}
          </span>
        </div>
      </div>

    </div>
  );
}