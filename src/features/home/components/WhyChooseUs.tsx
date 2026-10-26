"use client";

import { FaAward, FaClock } from "react-icons/fa";
import { FaShieldHeart } from "react-icons/fa6";
import { LuMapPinCheck } from "react-icons/lu";
import { useTranslations } from "next-intl";
import FeatureCard from "./FeatureCard";

const FEATURES = [
  {
    id: 1,
    icon: FaAward,
    title: "bestCompanies",
    description: "bestCompaniesDescription",
  },
  {
    id: 2,
    icon: FaClock,
    title: "roundTheClockSupport",
    description: "roundTheClockSupportDescription",
  },
  {
    id: 3,
    icon: FaShieldHeart,
    title: "comprehensiveInsurance",
    description: "comprehensiveInsuranceDescription",
  },
  {
    id: 4,
    icon: LuMapPinCheck,
    title: "flexiblePickup",
    description: "flexiblePickupDescription",
  },
];

export default function WhyChooseUs() {
  const t = useTranslations("whyChooseUs");

  return (
    <section
      className="relative my-12.5 overflow-hidden bg-[linear-gradient(rgba(30,30,30,0.72),rgba(30,30,30,0.72)),url('/images/hero/hero-2.png')] bg-cover bg-fixed bg-center py-20 max-md:py-12"
      id="why-choose-us"
    >
      <div className="overlay absolute inset-0 backdrop-blur-[2px]" />

      <div className="relative z-2 mx-auto w-full max-w-7xl px-2">
        <div className="grid grid-cols-[320px_1fr] items-center gap-8 max-lg:grid-cols-1 lg:gap-17.5">
          <div className="text-text-on-brand flex flex-col items-stretch justify-between gap-6">
            <span className="bg-action-primary/18 text-action-primary inline-block w-fit rounded-full px-4.5 py-2 font-bold">
              {t("smallTitle")}
            </span>

            <h2 className="text-text-on-brand m-0 text-3xl leading-[1.1] font-extrabold lg:text-[52px]">
              {t("title")}
              {t("brandQuestion")}
            </h2>

            <p className="text-text-on-brand/85 m-0 text-[18px] leading-[1.9]">
              {t("description")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:gap-7">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <FeatureCard
                  icon={<Icon />}
                  title={`${t(`features.${item.title}`)}`}
                  description={`${t(`features.${item.description}`)}`}
                  key={item.id}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
