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

export default function BookingCountdown({
  targetDateTime,
}: Props) {
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
      <div className="booking-countdown expired">
        <p>{t("expired")}</p>
      </div>
    );
  }

  return (
    <div className="booking-countdown">
      <h3>{t("remaining")}</h3>

      <div className="countdown-units">
        <div className="unit">
          <span className="number">{String(state.days).padStart(2, "0")}</span>

          <span className="label">{t("days")}</span>
        </div>

        <span className="separator">:</span>

        <div className="unit">
          <span className="number">{String(state.hours).padStart(2, "0")}</span>

          <span className="label">{t("hours")}</span>
        </div>

        <span className="separator">:</span>

        <div className="unit">
          <span className="number">
            {String(state.minutes).padStart(2, "0")}
          </span>

          <span className="label">{t("minutes")}</span>
        </div>
      </div>
    </div>
  );
}
