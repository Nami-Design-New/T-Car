"use client";

import type { IconType } from "react-icons";
import { useTranslations } from "next-intl";
import { FiBell, FiCalendar, FiCreditCard, FiUser } from "react-icons/fi";
import { PiBank } from "react-icons/pi";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { accountSectionPath, type AccountTab } from "../model";

const SECTIONS: { id: AccountTab; label: string; icon: IconType }[] = [
  { id: "profile", label: "profile", icon: FiUser },
  { id: "bookings", label: "bookings", icon: FiCalendar },
  { id: "wallet", label: "wallet", icon: FiCreditCard },
  { id: "bank-accounts", label: "bankAccounts", icon: PiBank },
  { id: "notifications", label: "notifications", icon: FiBell },
];

/** The account sections as links (doc 5): each one is its own route. */
export default function AccountNav() {
  const t = useTranslations("account.nav");
  const pathname = usePathname();

  return (
    <nav
      className="border-stroke-light bg-surface-elevated sticky top-25 flex flex-col gap-1 rounded-lg border p-2 max-lg:static max-lg:[scrollbar-width:none] max-lg:flex-row max-lg:overflow-x-auto max-lg:[&::-webkit-scrollbar]:hidden"
      aria-label={t("account")}
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const href = accountSectionPath(id);
        // A section stays active on its sub-pages (e.g. /account/bookings/[id]).
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md border-0 px-3.5 py-3 text-base font-semibold whitespace-nowrap transition duration-200",
              active
                ? "bg-action-primary text-text-on-action hover:bg-action-primary"
                : "text-text-subtle hover:bg-surface-card-primary bg-transparent",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="shrink-0 text-[17px]" aria-hidden="true" />
            <span>{t(label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
