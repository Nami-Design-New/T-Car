'use client';

import {
  FiAward,
  FiClock,
  FiShield,
  FiMapPin,
} from 'react-icons/fi';

const FEATURES = [
  {
    icon: FiAward,
    title: 'أفضل شركات التأجير',
    description:
      'نتعاون مع أفضل شركات ومعارض تأجير السيارات لتوفير تجربة موثوقة وآمنة.',
  },
  {
    icon: FiClock,
    title: 'دعم على مدار الساعة',
    description:
      'فريق خدمة العملاء متواجد 24/7 للإجابة عن جميع استفساراتك.',
  },
  {
    icon: FiShield,
    title: 'تأمين شامل',
    description:
      'خيارات تأمين متعددة تمنحك راحة البال أثناء رحلتك.',
  },
  {
    icon: FiMapPin,
    title: 'استلام وتسليم مرن',
    description:
      'اختر المكان والوقت المناسبين لاستلام وتسليم سيارتك.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="why_choose_us section" id="why-choose-us">

      <div className="overlay" />

      <div className="container-tcar">

        <div className="why_choose_us_wrapper">

          <div className="why_left">

            <span className="section_label">
              لماذا نحن
            </span>

            <h2>
              لماذا تختار
              <br />
              TCar؟
            </h2>

            <p>
              نجعل تجربة استئجار السيارة أسهل وأسرع وأكثر أمانًا،
              مع أفضل الأسعار وخدمة احترافية أينما كنت.
            </p>

          </div>

          <div className="why_right">

            {FEATURES.map((item, index) => {

              const Icon = item.icon;

              return (

                <div
                  className="feature_card"
                  key={index}
                >

                  <div className="icon">

                    <Icon />

                  </div>

                  <div>

                    <h3>{item.title}</h3>

                    <p>{item.description}</p>

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