'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown } from 'react-icons/fi';
import SectionTitle from '@components/common/SectionTitle';
import type { FAQItem } from '@app-types/index';

const FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'ما هي المستندات المطلوبة لاستئجار سيارة؟',
    answer:
      'يلزم تقديم رخصة قيادة سارية، وهوية وطنية أو إقامة، بالإضافة إلى وسيلة دفع باسم المستأجر.',
  },
  {
    id: '2',
    question: 'هل يمكنني إلغاء الحجز؟',
    answer:
      'يمكنك الإلغاء مجانًا قبل موعد الاستلام بـ 24 ساعة.',
  },
  {
    id: '3',
    question: 'هل يشمل السعر التأمين؟',
    answer:
      'يشمل التأمين الأساسي مع إمكانية إضافة تأمين شامل.',
  },
  {
    id: '4',
    question: 'هل يمكن استلام السيارة من فرع وإعادتها لفرع آخر؟',
    answer:
      'نعم حسب توفر الخدمة داخل المدينة.',
  },
  {
    id: '5',
    question: 'ما هي وسائل الدفع؟',
    answer:
      'بطاقات مدى، فيزا، ماستر كارد، والمحفظة الإلكترونية.',
  },
  {
    id: '6',
    question: 'هل يمكن تمديد مدة الإيجار؟',
    answer:
      'يمكن تمديد الإيجار إذا كانت السيارة متاحة.',
  },
  
];

export default function FAQ() {
  const { t } = useTranslation();

  const [openId, setOpenId] = useState<string | null>('1');

  const left = FAQS.slice(0, Math.ceil(FAQS.length / 2));
  const right = FAQS.slice(Math.ceil(FAQS.length / 2));

  const renderColumn = (items: FAQItem[]) =>
    items.map((item) => {
      const isOpen = openId === item.id;

      return (
        <div
          key={item.id}
          className={`faq-item ${isOpen ? 'active' : ''}`}
        >
          <button
            className="faq-question"
            onClick={() =>
              setOpenId(isOpen ? null : item.id)
            }
          >
            <span>{item.question}</span>

            <div className="faq-question-icon">
              <FiChevronDown
                className={isOpen ? 'rotate' : ''}
              />
            </div>
          </button>

          <div className={`faq-answer ${isOpen ? 'show' : ''}`}>
            <p>{item.answer}</p>
          </div>
        </div>
      );
    });

  return (
    <section className="faqs section" id="faqs">
      <div className="container-tcar">

        <SectionTitle
          smallTitle={t('faq.smallTitle')}
          title={t('faq.title')}
          subtitle={t('faq.subtitle')}
        />

        <div className="faq-grid">

          <div className="faq-column">
            {renderColumn(left)}
          </div>

          <div className="faq-column">
            {renderColumn(right)}
          </div>

        </div>

      </div>
    </section>
  );
}