import { FiCalendar, FiMapPin, FiInfo } from "react-icons/fi";
import { useTranslations } from "next-intl";

interface Props {
  pickupLocation: string;
  dropoffLocation: string;

  pickupDateTime: string;
  dropoffDateTime: string;

  warrantyNote: string;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);

  const date = d.toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const time = d.toLocaleTimeString("ar-SA", {
    hour: "numeric",
    minute: "2-digit",
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
  const t = useTranslations("myBookings.dates");
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-stroke-light bg-surface-elevated p-6">
      {/* Location */}
      <div className="flex flex-col gap-3 border-b border-stroke-light pb-4 last:border-0">
        <h3 className="m-0 text-base font-bold text-text-primary">
          {t("location")}
        </h3>

        <div className="flex items-start gap-3 text-sm leading-relaxed text-text-primary">
          <span className="mt-1 shrink-0 text-action-primary">
            <FiMapPin />
          </span>

          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-text-subtle">
              {t("pickupAddress")}
            </span>

            <span className="text-sm font-medium text-text-primary">
              {pickupLocation}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm leading-relaxed text-text-primary">
          <span className="mt-1 shrink-0 text-action-primary">
            <FiMapPin />
          </span>

          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-text-subtle">
              {t("dropoffAddress")}
            </span>

            <span className="text-sm font-medium text-text-primary">
              {dropoffLocation}
            </span>
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="flex flex-col gap-3 border-b border-stroke-light pb-4 last:border-0">
        <h3 className="m-0 text-base font-bold text-text-primary">
          {t("date")}
        </h3>

        <div className="flex items-start gap-3 text-sm leading-relaxed text-text-primary">
          <span className="mt-1 shrink-0 text-action-primary">
            <FiCalendar />
          </span>

          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-text-subtle">
              {t("pickupTime")}
            </span>

            <span className="text-sm font-medium text-text-primary">
              {formatDateTime(pickupDateTime)}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm leading-relaxed text-text-primary">
          <span className="mt-1 shrink-0 text-action-primary">
            <FiCalendar />
          </span>

          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-text-subtle">
              {t("dropoffTime")}
            </span>

            <span className="text-sm font-medium text-text-primary">
              {formatDateTime(dropoffDateTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Additional details */}
      <div className="flex items-start gap-3 rounded-md bg-surface-card-primary p-3 text-sm leading-relaxed text-text-primary">
        <FiInfo />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-subtle">
            {t("additionalDetails")}
          </span>

          <span>{warrantyNote}</span>
        </div>
      </div>
    </div>
  );
}
