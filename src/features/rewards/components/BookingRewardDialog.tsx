"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { FiCheck } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
interface Props {
  reward: {
    earnedPoints: number;
    tierPoints: number;
    balance: number;
  };
}

const confetti = [
  "top-0 start-1/2 h-1 w-2.5 -rotate-30 bg-green-500",
  "top-8 end-6 h-1 w-2.5 rotate-30 bg-blue-500",
  "top-10 start-4 h-1 w-2.5 -rotate-12 bg-amber-500",
  "top-16 start-6 size-2 bg-blue-500",
  "top-20 end-4 size-2 bg-amber-500",
  "top-28 end-1 h-1 w-2.5 -rotate-30 bg-orange-500",
  "bottom-16 start-2 h-1 w-2.5 rotate-6 bg-green-500",
  "bottom-10 end-4 size-2 bg-green-500",
  "bottom-5 start-6 size-2 bg-amber-500",
  "bottom-2 start-1/3 h-1 w-2.5 -rotate-12 bg-blue-500",
];

export default function BookingRewardDialog({ reward }: Props) {
  const [open, setOpen] = useState(true);
  const t = useTranslations("bookingReward");
  const format = useFormatter();
  const earned = format.number(reward.earnedPoints);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      size="sm"
      className="gap-4! bg-[#f0f6ff]! p-4! max-[575px]:h-dvh max-[575px]:max-h-none max-[575px]:w-screen max-[575px]:max-w-none max-[575px]:rounded-none"
    >
      <Dialog.Header>
        <Dialog.Title className="text-base! font-bold!">
          {t("header")}
        </Dialog.Title>
        <Dialog.Close className="size-11! rounded-xl! border! border-neutral-200! bg-white!" />
      </Dialog.Header>
      <Dialog.Body className="flex flex-col items-center gap-4 pt-3">
        <div
          className="relative grid size-52 shrink-0 place-items-center"
          aria-hidden="true"
        >
          {confetti.map((piece) => (
            <span key={piece} className={`absolute rounded-full ${piece}`} />
          ))}
          <span className="grid size-50 place-items-center rounded-full bg-blue-100/70">
            <span className="grid size-40 place-items-center rounded-full bg-blue-200/70">
              <span className="grid size-29 place-items-center rounded-full bg-[linear-gradient(150deg,#438fff,#0752c3)] text-4xl text-white shadow-lg">
                <FiCheck />
              </span>
            </span>
          </span>
        </div>
        <div className="text-center">
          <h2 className="m-0 text-2xl font-bold">{t("title")}</h2>
          <Dialog.Description className="mx-auto! mt-1! text-sm">
            {t("description", { points: earned })}
          </Dialog.Description>
        </div>
        <div className="flex justify-center gap-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-3 text-end">
            <p className="m-0 text-xs text-neutral-500">
              <span className="me-1 inline-block size-2 rounded-full bg-blue-500" />
              {t("redeemable")}
            </p>
            <strong className="text-lg text-blue-500" dir="ltr">
              +{earned}
            </strong>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-3 text-end">
            <p className="m-0 text-xs text-neutral-500">
              <span className="me-1 inline-block size-2 rounded-full bg-green-600" />
              {t("tier")}
            </p>
            <strong className="text-lg text-green-600" dir="ltr">
              +{earned}
            </strong>
          </div>
        </div>
        <p className="m-0 flex w-full flex-col rounded-xl border border-neutral-200 bg-white p-3 text-center text-sm">
          <strong className="text-blue-500">
            {t("tierBalance", { points: format.number(reward.tierPoints) })}
          </strong>
          <span className="text-neutral-500">
            {t("redeemableBalance", { points: format.number(reward.balance) })}
          </span>
        </p>
        <div className="flex w-full flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/account/rewards">{t("viewRewards")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/account/rewards/catalog">{t("redeem")}</Link>
          </Button>
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
