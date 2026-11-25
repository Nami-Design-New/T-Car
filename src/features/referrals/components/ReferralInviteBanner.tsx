"use client";

import { useTranslations } from "next-intl";
import { useReferralCodeStore } from "../referralCodeStore";

/** "Invite from Ahmed · Your code is ready" under the phone and code steps. */
export default function ReferralInviteBanner() {
  const t = useTranslations("auth.referral");
  const { code, status, inviterName } = useReferralCodeStore();
  if (status !== "valid") return null;

  return (
    <p className="text-action-primary m-0 mt-4 text-center text-sm font-semibold">
      {t.rich(inviterName === null ? "bannerNoName" : "banner", {
        name: inviterName ?? "",
        code: () => <bdi dir="ltr">{code}</bdi>,
      })}
    </p>
  );
}
