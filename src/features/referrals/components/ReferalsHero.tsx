import { IMAGES } from "@/shared/config/assets";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ReferralProgram } from "../model";

export default function ReferalsHero({
  program,
}: {
  program: ReferralProgram;
}) {
  const t = useTranslations("account.referrals");
  return (
    <div className="border-stroke-light bg-surface-elevated grid items-center gap-8 overflow-hidden rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 flex-col gap-2 max-md:text-center">
        <p className="m-0 text-lg font-bold">{t("heroTitle")}</p>
        <h2 className="text-action-primary m-0 text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.2] font-bold">
          {t("heroReward", { points: program.rewardPoints })}
        </h2>
        <p className="text-text-subtle m-0 text-sm">{t("heroDescription")}</p>
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
  );
}
