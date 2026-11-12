"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { ACCOUNT_TABS, accountSectionPath, type AccountTab } from "../model";

interface Props {
  fallback: string;
}

const sectionLabels: Record<AccountTab, string> = {
  profile: "profile",
  bookings: "bookings",
  wallet: "wallet",
  "bank-accounts": "bankAccounts",
  notifications: "notifications",
};

/** Keeps the shared account header aligned with the active account route. */
export default function AccountPageTitle({ fallback }: Props) {
  const t = useTranslations("account");
  const pathname = usePathname();
  const section = ACCOUNT_TABS.find((tab) => {
    const path = accountSectionPath(tab);
    return pathname === path || pathname.startsWith(`${path}/`);
  });

  return (
    <h1 className="m-0">
      {section ? t(`nav.${sectionLabels[section]}`) : fallback}
    </h1>
  );
}
