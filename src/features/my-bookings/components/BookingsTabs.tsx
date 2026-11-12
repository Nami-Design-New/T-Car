import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { bookingsListPath, type BookingTab } from "../model";
import { cn } from "@/shared/lib/cn";

interface Props {
  active: BookingTab;
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
export default function BookingsTabs({ active }: Props) {
  const t = useTranslations("myBookings.tabs");

  return (
    <nav
      className="bg-surface-on-background mb-4 flex w-full items-center gap-2 rounded-lg p-1.5 shadow-sm"
      aria-label={t("title")}
    >
      {TABS.map(({ id, label }) => (
        <Link
          key={id}
          href={bookingsListPath(id)}
          className={cn(
            "focus-visible:outline-action-primary flex h-13.75 flex-1 items-center justify-center gap-2.5 rounded-md text-[0.95rem] font-bold no-underline transition focus-visible:outline-2",
            active === id
              ? "bg-action-primary text-text-on-action"
              : "text-text-primary bg-text-on-action hover:bg-surface-card-primary",
          )}
          aria-current={active === id ? "page" : undefined}
          // A filter of the same page: no new scroll position.
          scroll={false}
        >
          {t(label)}
        </Link>
      ))}
    </nav>
  );
}
