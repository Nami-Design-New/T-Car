'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';;
import { FiChevronDown } from 'react-icons/fi';
import SectionTitle from '@/shared/ui/SectionTitle';
import type { FAQItem } from '../model';


interface Props {
  faqs: FAQItem[];
}

export default function FAQ({ faqs }: Props) {
  const t = useTranslations();


  const [openId, setOpenId] = useState<string | null>('1');

  const left = faqs.slice(0, Math.ceil(faqs.length / 2));
  const right = faqs.slice(Math.ceil(faqs.length / 2));

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