import clsx from "clsx";
import { FiCalendar } from "react-icons/fi";
import type { BookingStatus } from "../model";

interface Props {
  status: BookingStatus;
  label: string;
  dateTime: string;
  className?: string;
}

const STATUS_CLASSES: Record<BookingStatus, string> = {
  current: "bg-primary-100 text-action-primary",
  completed: "bg-success-50 text-status-success",
  upcoming: "bg-warning-50 text-status-warning",
  late: "bg-status-error-background text-status-error",
  cancelled: "bg-status-error-background text-status-error",
};

export default function BookingStatusBadge({
  status,
  label,
  dateTime,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "flex min-w-0 items-center justify-between gap-2 h-auto  rounded-md px-2 py-1",
        STATUS_CLASSES[status],
        className,
      )}
    >
      <p className="shrink-0 font-bold m-0">{label}</p>
      <div className="flex min-w-0 items-center  gap-ds-2 text-xs font-semibold">
        <p className="m-0  text-xs font-normal ">{dateTime}</p>
      </div>
    </div>
  );
}
