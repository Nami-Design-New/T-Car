import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { bookingsListPath, type BookingTab } from "../model";

interface Props {
  active: BookingTab;
  activeCount: number;
  pastCount: number;
}

const TABS: { id: BookingTab; label: string }[] = [
  { id: "active", label: "active" },
  { id: "past", label: "past" },
];

/**
 * Current / past bookings as links to ?status= (doc 5): the list is a view of
 * the same data, so it lives in the URL, survives a refresh, and the details
 * page can link back to the right list.
 */
export default function BookingsTabs({ active, activeCount, pastCount }: Props) {
  const t = useTranslations("myBookings.tabs");
  const counts: Record<BookingTab, number> = {
    active: activeCount,
    past: pastCount,
  };

  return (
    <nav
      className="mb-4 flex w-full items-center rounded-lg border border-stroke-light bg-surface-elevated p-1.5 shadow-sm"
      aria-label={t("title")}
    >
      {TABS.map(({ id, label }) => (
        <Link
          key={id}
          href={bookingsListPath(id)}
          className={`flex h-13.75 flex-1 items-center justify-center gap-2.5 rounded-md text-[0.95rem] font-bold text-text-primary no-underline transition hover:bg-surface-card-primary focus-visible:outline-2 focus-visible:outline-action-primary ${active === id ? "bg-action-primary text-text-on-action hover:bg-action-primary" : ""}`}
          aria-current={active === id ? "page" : undefined}
          // A filter of the same page: no new scroll position.
          scroll={false}
        >
          {t(label)}
          <span className="grid size-6 place-items-center rounded-full bg-surface-card-primary text-xs font-bold text-text-subtle">
            {counts[id]}
          </span>
        </Link>
      ))}
    </nav>
  );
}
