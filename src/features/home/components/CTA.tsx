"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/Button";
import JoinUsForm from "./JoinUsForm";

export default function CTA() {
  const t = useTranslations("homeCta");
  const [joinUsOpen, setJoinUsOpen] = useState(false);

  return (
    <section className="mb-20 max-md:mb-12">
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--color-action-primary),#1a6bd4)] px-7.5 py-15 text-center before:absolute before:-start-0.5 before:top-[29%] before:z-[1] before:size-80 before:bg-[url('/images/brand/fav.svg')] before:bg-contain before:bg-center before:bg-no-repeat before:opacity-[0.09] before:brightness-0 before:invert before:content-[''] max-lg:rounded-2xl max-md:px-5 max-md:py-7.5">
          <div className="cta_pattern pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,white_2px,transparent_2px),radial-gradient(circle_at_80%_40%,white_2px,transparent_2px),radial-gradient(circle_at_40%_80%,white_2px,transparent_2px)] [background-size:80px_80px] opacity-[0.08]" />

          <div className="cta_text relative z-2 mx-auto max-w-175">
            <h3 className="text-text-on-action mb-3.5 text-[34px] font-bold max-md:text-[26px]">
              {t("title")}
            </h3>

            <p className="text-text-on-action/90 mb-7.5 text-[17px] leading-[1.8] max-md:text-[15px]">
              {t("description")}
            </p>

            <Button
              type="button"
              size="lg"
              aria-haspopup="dialog"
              variant="outline"
              className="bg-white!"
              onClick={() => setJoinUsOpen(true)}
            >
              {t("cta")}
            </Button>
          </div>
        </div>
      </div>

      <JoinUsForm open={joinUsOpen} onClose={() => setJoinUsOpen(false)} />
    </section>
  );
}
