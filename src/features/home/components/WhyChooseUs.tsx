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
    <section className="why_choose_us section" id="why-choose-us">
      <div className="overlay" />

      <div className="container-tcar">
        <div className="why_choose_us_wrapper">
          <div className="why_left">
            <span className="section_label">{t('smallTitle')}</span>

            <h2>
              {t('title')}
              <br />
              {t('brandQuestion')}
            </h2>

            <p>{t('description')}</p>
          </div>

          <div className="why_right">
            {FEATURES.map((item, index) => {
              const Icon = item.icon;

              return (
                <div className="feature_card" key={index}>
                  <div className="icon">
                    <Icon />
                  </div>

                  <div>
                    <h3>{t(`features.${item.title}`)}</h3>

                    <p>{t(`features.${item.description}`)}</p>
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
