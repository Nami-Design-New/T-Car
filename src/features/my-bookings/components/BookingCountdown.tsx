"use client";

import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  /** The booking's return time, as returned by the API. */
  targetDateTime: string;
  mode: "late" | "remaining";
}

function getState(target: Date, mode: Props["mode"]) {
  const now = Date.now();
  const diff = Math.max(
    0,
    mode === "late" ? now - target.getTime() : target.getTime() - now,
  );

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

export default function BookingCountdown({ targetDateTime, mode }: Props) {
  const t = useTranslations("myBookings.countdown");

  const [state, setState] = useState(() =>
    getState(new Date(targetDateTime), mode),
  );

  useEffect(() => {
    const target = new Date(targetDateTime);

    setState(getState(target, mode));

    const interval = setInterval(() => {
      setState(getState(target, mode));
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, targetDateTime]);

  const units = [
    { key: "days", value: String(state.days) },
    { key: "hours", value: String(state.hours).padStart(2, "0") },
    { key: "minutes", value: String(state.minutes).padStart(2, "0") },
  ] as const;

  return (
    <section className="bg-surface-elevated flex flex-col gap-4 rounded-lg p-5">
      <div className="flex flex-col gap-2">
        <h3
          className={
            mode === "late"
              ? "text-status-error m-0 text-lg font-bold"
              : "text-text-primary m-0 text-lg font-bold"
          }
        >
          {t(mode === "late" ? "title" : "remainingTitle")}
        </h3>
        <p className="text-text-subtle m-0 text-base">
          {t(mode === "late" ? "lateBy" : "remainingBy")}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 max-[400px]:gap-1.5">
        {units.map(({ key, value }, index) => (
          <Fragment key={key}>
            {index > 0 && (
              <span
                className="text-text-subtle flex flex-col gap-2"
                aria-hidden="true"
              >
                <span className="size-1.5 rounded-full bg-current" />
                <span className="size-1.5 rounded-full bg-current" />
              </span>
            )}
            {/* Flip-clock tile: two light-grey gradient halves split by a
                white gap, large radius, soft shadow below. */}
            <div className="flex w-30 flex-col overflow-hidden rounded-sm bg-white shadow-[0_6px_10px_-4px_rgba(30,30,30,0.25)] max-[400px]:w-22">
              <span className="text-text-primary flex h-14 items-center justify-center bg-linear-to-b from-neutral-200 to-neutral-100 text-2xl leading-none font-bold tabular-nums max-[400px]:h-16 max-[400px]:text-5xl">
                {value}
              </span>
              <span className="text-text-primary mt-1 flex h-14 items-center justify-center bg-linear-to-b from-neutral-100 to-white text-xl font-bold max-[400px]:h-16 max-[400px]:text-3xl">
                {t(key)}
              </span>
            </div>
          </Fragment>
        ))}
      </div>

      {mode === "late" && (
        <p className="text-status-error m-0 text-sm">{t("lateFeeHint")}</p>
      )}
    </section>
  );
}
