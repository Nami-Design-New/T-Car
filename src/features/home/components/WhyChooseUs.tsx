'use client';

import { FaAward, FaClock  } from 'react-icons/fa';
import { FaShieldHeart } from 'react-icons/fa6';
import { LuMapPinCheck } from "react-icons/lu";
import { useTranslations } from 'next-intl';

const FEATURES = [
  {
    icon: FaAward,
    title: 'bestCompanies',
    description: 'bestCompaniesDescription',
  },
  {
    icon: FaClock,
    title: 'roundTheClockSupport',
    description: 'roundTheClockSupportDescription',
  },
  {
    icon: FaShieldHeart ,
    title: 'comprehensiveInsurance',
    description: 'comprehensiveInsuranceDescription',
  },
  {
    icon: LuMapPinCheck ,
    title: 'flexiblePickup',
    description: 'flexiblePickupDescription',
  },
];

export default function WhyChooseUs() {
  const t = useTranslations('whyChooseUs');

  return (
    <section className="why_choose_us section relative my-[50px] overflow-hidden bg-[linear-gradient(rgba(30,30,30,0.72),rgba(30,30,30,0.72)),url('/images/hero/hero-2.png')] bg-cover bg-center bg-fixed" id="why-choose-us">
      <div className="overlay absolute inset-0 backdrop-blur-[2px]" />

      <div className="container-tcar relative z-[2]">
        <div className="why_choose_us_wrapper grid grid-cols-[320px_1fr] items-center gap-[70px] max-lg:grid-cols-1 max-lg:gap-[50px]">
          <div className="why_left text-text-on-brand">
            <span className="section_label mb-[18px] inline-block rounded-full bg-action-primary/[0.18] px-[18px] py-2 font-bold text-action-primary">{t('smallTitle')}</span>

            <h2 className="mb-[22px] text-[52px] font-extrabold leading-[1.1] text-text-on-brand">
              {t('title')}
              <br />
              {t('brandQuestion')}
            </h2>

            <p className="text-[17px] leading-[1.9] text-text-on-brand/[0.85]">{t('description')}</p>
          </div>

          <div className="why_right grid grid-cols-2 gap-7 max-md:grid-cols-1">
            {FEATURES.map((item, index) => {
              const Icon = item.icon;

              return (
                <div className="feature_card flex items-start gap-[22px] rounded-2xl border border-text-on-brand/[0.08] bg-text-on-brand/[0.08] p-7 backdrop-blur-[12px] transition duration-300 hover:-translate-y-2.5 hover:border-action-primary/40 hover:bg-text-on-brand/[0.12] hover:shadow-[0_18px_40px_rgba(30,30,30,0.25)]" key={index}>
                  <div className="icon flex size-[72px] shrink-0 items-center justify-center rounded-xl bg-action-primary transition duration-300 hover:shadow-[0_0_30px_rgba(31,127,250,0.55)]">
                    <Icon className="text-[34px] text-text-on-action" />
                  </div>

                  <div>
                    <h3 className="mb-2.5 text-[22px] font-bold text-text-on-brand">{t(`features.${item.title}`)}</h3>

                    <p className="m-0 text-[15px] leading-[1.9] text-text-on-brand/[0.75]">{t(`features.${item.description}`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
