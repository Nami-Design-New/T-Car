"use client";

import { useTranslations } from "next-intl";
import React from "react";

export default function HeroHeader() {
  const t = useTranslations();
  return (
    <div className="hero_content before:absolute before:inset-s-0 before:top-1/2 before:h-px before:w-[clamp(28px,9vw,112px)] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7))] before:content-[''] after:absolute after:inset-e-0 after:top-1/2 after:h-px after:w-[clamp(28px,9vw,112px)] after:rotate-180 after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7))] after:content-[''] absolute inset-s-6 inset-e-6 top-[clamp(108px,15vh,160px)] z-2 mx-auto w-[calc(100%-48px)] max-w-205 text-center text-text-on-brand animate-[hero-content-in_0.85s_cubic-bezier(0.22,1,0.36,1)_both] [text-shadow:0_10px_30px_rgba(30,30,30,0.28)] motion-reduce:animate-none max-md:relative max-md:inset-auto max-md:w-auto max-md:px-4 max-md:before:hidden max-md:after:hidden">
      <span className="hero_eyebrow inline-flex items-center gap-2.5 rounded-full border border-white/35 bg-white/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/92 backdrop-blur-sm max-md:text-xs max-md:tracking-[0.12em]">
        {t("rentalSearch.hero.eyebrow")}
      </span>
      <h1 className="mx-auto mb-3 mt-4.5 max-w-190 text-[clamp(2.2rem,5vw,4.8rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-shadow-[0_10px_30px_rgba(30,30,30,0.28)] max-md:mb-2 max-md:mt-3 max-md:text-[clamp(1.9rem,9vw,2.6rem)]">
        {t("rentalSearch.hero.title")}
      </h1>
      <p className="mx-auto max-w-140 text-[clamp(1rem,1.7vw,1.3rem)] font-medium leading-[1.7] text-white/90 max-md:max-w-75 max-md:text-[0.95rem] max-md:leading-[1.55]">
        {t("rentalSearch.hero.subtitle")}
      </p>
    </div>
  );
}
