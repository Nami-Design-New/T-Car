'use client';

import { useTranslation } from 'react-i18next';
import SectionTitle from '@/components/common/SectionTitle';

const sections = [
  {
    title: 'البيانات التي نقوم بجمعها',
    content:
      'نجمع المعلومات التي تقدمها عند إنشاء الحساب أو إجراء الحجز، مثل الاسم ورقم الجوال والبريد الإلكتروني وبيانات الحجز، وذلك لتقديم خدماتنا بشكل أفضل.',
  },
  {
    title: 'كيفية استخدام المعلومات',
    content:
      'تُستخدم بياناتك لإدارة الحجوزات، وتأكيد العمليات، والتواصل معك بشأن الطلبات، وتحسين جودة الخدمات المقدمة عبر منصة T-Car.',
  },
  {
    title: 'حماية بياناتك',
    content:
      'نلتزم باتخاذ الإجراءات الأمنية المناسبة لحماية بياناتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح.',
  },
  {
    title: 'مشاركة المعلومات',
    content:
      'لا يتم بيع أو مشاركة بياناتك مع أي طرف ثالث إلا عند الضرورة لتقديم الخدمة أو إذا كان ذلك مطلوبًا بموجب الأنظمة والقوانين.',
  },
  {
    title: 'حقوق المستخدم',
    content:
      'يمكنك طلب تحديث بياناتك أو تعديلها أو حذفها، كما يمكنك التواصل معنا للاستفسار عن كيفية معالجة معلوماتك الشخصية.',
  },
];

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <section className="section legal-page">
      <div className="container-tcar">

        <SectionTitle
          smallTitle={t('privacy.smallTitle')}
          title={t('privacy.title')}
          subtitle={t('privacy.subtitle')}
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