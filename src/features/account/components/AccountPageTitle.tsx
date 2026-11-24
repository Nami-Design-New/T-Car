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
  referrals: "referrals",
  rewards: "rewards",
};

/** Pages inside a section that have their own title, under `account.`. */
const pageTitles: Record<string, string> = {
  "/account/points": "points.historyTitle",
  "/account/referrals/history": "referrals.history.title",
};

/** Keeps the shared account header aligned with the active account route. */
export default function AccountPageTitle({ fallback }: Props) {
  const t = useTranslations("account");
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname];
  const section = ACCOUNT_TABS.find((tab) => {
    const path = accountSectionPath(tab);
    return pathname === path || pathname.startsWith(`${path}/`);
  });

  return (
    <h1 className="m-0">
      {pageTitle
        ? t(pageTitle)
        : section
          ? t(`nav.${sectionLabels[section]}`)
          : fallback}
    </h1>
  );
}
