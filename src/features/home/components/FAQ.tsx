import { useTranslations } from 'next-intl';
import { FiChevronDown } from 'react-icons/fi';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import type { FAQItem } from '../model';
import './FAQ.scss';

interface Props {
  faqs: FAQItem[];
}

/**
 * Native <details> instead of a JS accordion (doc 2 step 2): every answer
 * stays in the server HTML for search engines, and the section ships no
 * client JavaScript. The shared `name` makes the items exclusive (one open at
 * a time) in current browsers; older ones allow several open.
 */
export default function FAQ({ faqs }: Props) {
  const t = useTranslations();

  const left = faqs.slice(0, Math.ceil(faqs.length / 2));
  const right = faqs.slice(Math.ceil(faqs.length / 2));

  const renderColumn = (items: FAQItem[]) =>
    items.map((item) => (
      <details key={item.id} name="faq" className="faq-item" open={item.id === faqs[0]?.id}>
        <summary className="faq-question">
          <span className="faq-question-text">{item.question}</span>

          <span className="faq-question-icon" aria-hidden="true">
            <FiChevronDown />
          </span>
        </summary>

        <div className="faq-answer">
          <p>{item.answer}</p>
        </div>
      </details>
    ));

  return (
    <section className="faqs section" id="faqs">
      <div className="container-tcar">
        <SectionTitle
          smallTitle={t('faq.smallTitle')}
          title={t('faq.title')}
          subtitle={t('faq.subtitle')}
        />

        <div className="faq-grid">
          <div className="faq-column">{renderColumn(left)}</div>
          <div className="faq-column">{renderColumn(right)}</div>
        </div>
      </div>
    </section>
  );
}
