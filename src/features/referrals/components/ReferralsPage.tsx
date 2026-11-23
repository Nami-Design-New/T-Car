"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FiCheck, FiCopy, FiFileText, FiShare2 } from "react-icons/fi";
import { useNotify } from "@/shared/hooks/useNotify";
import { IMAGES } from "@/shared/config/assets";
import { Button } from "@/shared/ui/Button";
import type { ReferralProgram } from "../model";
import { useCopyText } from "../useCopyText";
import ReferralShareDialog from "./ReferralShareDialog";
import ReferralTermsDialog from "./ReferralTermsDialog";

interface Props {
  program: ReferralProgram;
}

const STEPS = ["share", "signUp", "earn"] as const;

/** "Invite a friend": the invite code, how to share it, and how the reward works. */
export default function ReferralsPage({ program }: Props) {
  const t = useTranslations("account.referrals");
  const notify = useNotify();
  const { copied, copy } = useCopyText();
  const [dialog, setDialog] = useState<"share" | "terms" | null>(null);

  const copyCode = async () => {
    if (await copy(program.code)) notify.success(t("codeCopied"));
    else notify.error(t("copyFailed"));
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="border-stroke-light grid items-center gap-8 overflow-hidden rounded-xl border bg-[linear-gradient(214deg,#f6faff_0%,#eff6fe_100%)] p-8 max-md:gap-5 max-md:p-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-2 max-md:text-center">
          <p className="m-0 text-lg font-bold">{t("heroTitle")}</p>
          <h2 className="text-action-primary m-0 text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] font-bold">
            {t("heroReward", { points: program.rewardPoints })}
          </h2>
          <p className="text-text-subtle m-0 text-base">
            {t("heroDescription")}
          </p>

          <div className="border-stroke-light bg-surface-elevated mt-4 flex flex-wrap items-center gap-3 rounded-lg border p-4">
            <div className="flex min-w-40 flex-1 flex-col gap-1 max-md:items-center">
              <span className="text-text-subtle text-sm">{t("codeLabel")}</span>
              <strong
                className="text-2xl font-bold tracking-[0.12em]"
                dir="ltr"
              >
                {program.code}
              </strong>
            </div>
            <div className="flex flex-wrap gap-3 max-md:w-full max-md:[&>*]:flex-1">
              <Button
                variant="outline"
                icon={copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}
                onClick={copyCode}
              >
                {copied ? t("copied") : t("copy")}
              </Button>
              <Button
                icon={<FiShare2 aria-hidden />}
                onClick={() => setDialog("share")}
              >
                {t("share")}
              </Button>
            </div>
          </div>
        </div>

        <Image
          src={IMAGES.referralGift.src}
          width={IMAGES.referralGift.width}
          height={IMAGES.referralGift.height}
          alt=""
          priority
          className="mx-auto size-48 max-md:order-first max-md:size-28"
        />
      </div>

      <div className="border-stroke-light bg-surface-elevated rounded-xl border p-6 max-md:p-5">
        <h2 className="m-0 mb-5 text-lg font-bold">{t("howTitle")}</h2>
        <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="bg-surface-card-primary flex items-start gap-3 rounded-lg p-4"
            >
              <span
                className="bg-action-primary text-text-on-action grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <strong className="text-base">
                  {t(`steps.${step}.title`)}
                </strong>
                <span className="text-text-subtle text-sm">
                  {t(`steps.${step}.description`, {
                    points: program.rewardPoints,
                  })}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
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
