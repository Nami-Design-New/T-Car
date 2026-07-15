'use client';

import { useTranslation } from 'react-i18next';
import SectionTitle from '@/components/common/SectionTitle';

const sections = [
  {
    title: 'قبول الشروط',
    content:
      'باستخدامك لمنصة T-Car فإنك تقر بموافقتك على جميع الشروط والأحكام الواردة في هذه الصفحة، كما توافق على الالتزام بجميع الأنظمة والتعليمات المعمول بها.',
  },
  {
    title: 'الحجوزات والتأجير',
    content:
      'تخضع جميع الحجوزات لتوفر السيارات. يجب على المستخدم تقديم بيانات صحيحة وحديثة، ويحق للمنصة إلغاء أي حجز يحتوي على معلومات غير صحيحة.',
  },
  {
    title: 'الدفع والاسترداد',
    content:
      'تتم جميع عمليات الدفع وفق الأسعار الظاهرة أثناء الحجز، ويتم تطبيق سياسة الاسترداد والإلغاء حسب الشروط المحددة لكل حجز.',
  },
  {
    title: 'التزامات المستأجر',
    content:
      'يلتزم المستأجر بالمحافظة على السيارة واستخدامها بطريقة قانونية وآمنة، كما يتحمل مسؤولية أي مخالفات أو أضرار تنتج عن سوء الاستخدام.',
  },
  {
    title: 'تعديل الشروط',
    content:
      'تحتفظ منصة T-Car بالحق في تعديل هذه الشروط والأحكام في أي وقت، ويعتبر استمرار استخدام المنصة موافقة على التعديلات الجديدة.',
  },
];

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <section className="section legal-page">
      <div className="container-tcar">

        <SectionTitle
          smallTitle={t('terms.smallTitle')}
          title={t('terms.title')}
          subtitle={t('terms.subtitle')}
        />

        <div className="legal-content">
          {sections.map((section, index) => (
            <article
              className="legal-card"
              key={index}
            >
              <div className="legal-card-number">
                {String(index + 1).padStart(2, '0')}
              </div>

              <div className="legal-card-content">
                <h3>{section.title}</h3>
                <p>{section.content}</p>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}