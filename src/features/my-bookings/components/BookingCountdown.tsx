"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  targetDateTime: string;
}

function getState(target: Date) {
  const now = Date.now();

  const diff = Math.max(0, target.getTime() - now);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: diff <= 0,
  };
}

export default function BookingCountdown({ targetDateTime }: Props) {
  const t = useTranslations("myBookings.countdown");

  const [state, setState] = useState(() => getState(new Date(targetDateTime)));

  useEffect(() => {
    const target = new Date(targetDateTime);

    setState(getState(target));

    const interval = setInterval(() => {
      setState(getState(target));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDateTime]);

  if (state.expired) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-stroke-light bg-surface-elevated p-5">
        <p className="m-0 text-sm font-bold text-text-subtle">{t("expired")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-stroke-light bg-surface-elevated p-4">
      <h3 className="m-0 text-sm font-bold text-text-primary">
        {t("remaining")}
      </h3>

      <div className="flex items-center justify-center gap-2.5 max-[400px]:gap-1.5">
        <div className="flex h-[66px] w-[58px] flex-col items-center justify-center rounded border border-stroke-light bg-gradient-to-b from-surface-on-background to-surface-elevated shadow-sm max-[400px]:h-[62px] max-[400px]:w-[52px]">
          <span className="text-[1.35rem] font-extrabold leading-none tabular-nums text-text-primary max-[400px]:text-xl">
            {String(state.days).padStart(2, "0")}
          </span>

          <span className="mt-1.5 text-[0.65rem] font-semibold text-text-subtle">
            {t("days")}
          </span>
        </div>

        <span className="-mt-1 text-2xl font-bold text-text-subtle">:</span>

        <div className="flex h-[66px] w-[58px] flex-col items-center justify-center rounded border border-stroke-light bg-gradient-to-b from-surface-on-background to-surface-elevated shadow-sm max-[400px]:h-[62px] max-[400px]:w-[52px]">
          <span className="text-[1.35rem] font-extrabold leading-none tabular-nums text-text-primary max-[400px]:text-xl">
            {String(state.hours).padStart(2, "0")}
          </span>

          <span className="mt-1.5 text-[0.65rem] font-semibold text-text-subtle">
            {t("hours")}
          </span>
        </div>

        <span className="-mt-1 text-2xl font-bold text-text-subtle">:</span>

        <div className="flex h-[66px] w-[58px] flex-col items-center justify-center rounded border border-stroke-light bg-gradient-to-b from-surface-on-background to-surface-elevated shadow-sm max-[400px]:h-[62px] max-[400px]:w-[52px]">
          <span className="text-[1.35rem] font-extrabold leading-none tabular-nums text-text-primary max-[400px]:text-xl">
            {String(state.minutes).padStart(2, "0")}
          </span>

          <span className="mt-1.5 text-[0.65rem] font-semibold text-text-subtle">
            {t("minutes")}
          </span>
        </div>
      </div>
    </div>
  );
}
