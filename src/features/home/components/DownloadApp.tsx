"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { IMAGES } from "@/shared/config/assets";
const phone = IMAGES.appPhone;
const appStore = IMAGES.appStore;
const playStore = IMAGES.googlePlay;

export default function DownloadApp() {
  const t = useTranslations("downloadApp");

  return (
    <section className="overflow-visible pb-20 max-md:pb-12">
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="text-text-on-brand relative flex min-h-105 items-center justify-end overflow-visible rounded-2xl bg-[linear-gradient(135deg,var(--color-brand),#1a6bd4)] px-17.5 py-15 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_90%_20%,rgba(31,127,250,0.18),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_35%)] before:content-[''] max-lg:min-h-0 max-lg:flex-col max-lg:rounded-xl max-lg:px-4.25 max-lg:py-8 max-lg:text-center">
          <div className="absolute inset-e-17.5 -top-25 z-5 hidden w-95 max-lg:relative max-lg:inset-auto max-lg:mx-auto max-lg:-mt-25 max-lg:mb-6.25 max-lg:w-65 md:block">
            <Image
              src={phone}
              alt={t("imageAlt")}
              width={520}
              height={760}
              priority
              className="block h-auto w-full"
            />
          </div>

          <div className="relative z-10 me-auto w-[48%] text-start max-lg:m-0 max-lg:w-full max-lg:text-center">
            <span className="tag bg-text-on-brand/12 mb-4.5 inline-flex rounded-full px-4.5 py-2 font-bold">
              {t("tag")}
            </span>

            <h2 className="mt-0 mb-4.5 text-[46px] leading-tight font-extrabold max-lg:mb-2.5 max-lg:text-[34px]">
              {t("title")}
            </h2>

            <p className="text-text-on-brand/85 mb-8.75 text-[17px] leading-[1.9]">
              {t("description")}
            </p>

            <div className="flex items-center gap-4.5 max-lg:justify-center">
              <a
                href="#"
                className="block transition duration-300 hover:-translate-y-1 hover:scale-[1.03]"
              >
                <Image
                  src={appStore}
                  alt={t("appStoreAlt")}
                  width={180}
                  height={54}
                  className="h-auto w-45 rounded-md transition duration-300 hover:shadow-[0_12px_30px_rgba(30,30,30,0.25)]"
                />
              </a>

              <a
                href="#"
                className="block transition duration-300 hover:-translate-y-1 hover:scale-[1.03]"
              >
                <Image
                  src={playStore}
                  alt={t("playStoreAlt")}
                  width={180}
                  height={54}
                  className="h-auto w-45 rounded-md transition duration-300 hover:shadow-[0_12px_30px_rgba(30,30,30,0.25)]"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
