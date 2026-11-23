"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/Button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FiFileText, FiShare2, FiUsers } from "react-icons/fi";
import type { ReferralProgram } from "../model";
import CodeShare from "./CodeShare";
import ReferralShareDialog from "./ReferralShareDialog";
import ReferralTermsDialog from "./ReferralTermsDialog";
import ReferalsHero from "./ReferalsHero";
import ReferalSteps from "./ReferalSteps";

type ReferralsPageProps = {
  program: ReferralProgram;
};

/** "Invite a friend": the invite code, how to share it, and how the reward works. */
export default function ReferralsPage({ program }: ReferralsPageProps) {
  const t = useTranslations("account.referrals");
  const [dialog, setDialog] = useState<"share" | "terms" | null>(null);

  return (
    <section className="flex flex-col gap-6">
      <ReferalsHero program={program} />
      <CodeShare program={program} />
      <div className="flex flex-wrap gap-3">
        <Button
          icon={<FiShare2 aria-hidden />}
          onClick={() => setDialog("share")}
          className="w-full"
        >
          {t("share")}
        </Button>
      </div>
      <div className="border-stroke-light bg-surface-elevated rounded-lg border p-4">
        <h2 className="m-0 mb-5 text-lg font-bold">{t("howTitle")}</h2>
        <ReferalSteps program={program} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 md:justify-between">
        <Button
          asChild
          variant="outline"
          icon={<FiUsers aria-hidden />}
          className="max-md:w-full"
        >
          <Link href="/account/referrals/history">{t("historyLink")}</Link>
        </Button>
        <button
          type="button"
          className="text-action-primary inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm font-semibold underline-offset-4 hover:underline"
          onClick={() => setDialog("terms")}
        >
          <FiFileText aria-hidden="true" />
          {t("termsLink")}
        </button>
      </div>

      <ReferralShareDialog
        open={dialog === "share"}
        onClose={() => setDialog(null)}
        code={program.code}
      />
      <ReferralTermsDialog
        open={dialog === "terms"}
        onClose={() => setDialog(null)}
        rewardPoints={program.rewardPoints}
      />
    </section>
  );
}
