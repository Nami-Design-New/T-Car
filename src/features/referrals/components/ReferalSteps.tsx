import React from "react";
import { ReferralProgram } from "../model";
import { useTranslations } from "next-intl";
const STEPS = ["share", "signUp", "earn"] as const;
export default function ReferalSteps({
  program,
}: {
  program: ReferralProgram;
}) {
  const t = useTranslations("account.referrals");
  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0">
      {STEPS.map((step, index) => (
        <li key={step} className="flex items-center gap-3 rounded-lg p-0">
          <span
            className="bg-surface-card-primary text-action-primary grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold md:text-base">
              {t(`steps.${step}.title`)}
            </p>
            <span className="text-text-subtle md-sm text-xs">
              {t(`steps.${step}.description`, {
                points: program.rewardPoints,
              })}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
