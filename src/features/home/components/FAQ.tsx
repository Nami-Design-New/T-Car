import { useTranslations } from 'next-intl';
import { FiChevronDown } from 'react-icons/fi';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import type { FAQItem } from '../model';

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
      <details key={item.id} name="faq" className="faq-item group border-b border-stroke-light" open={item.id === faqs[0]?.id}>
        <summary className="faq-question flex w-full cursor-pointer list-none items-center justify-between py-[22px] text-start text-lg font-medium text-text-primary transition duration-300 group-open:text-action-primary max-lg:text-[17px] max-md:py-[18px]">
          <span className="faq-question-text flex-1 pe-5 leading-[1.7] max-md:text-base">{item.question}</span>

          <span className="faq-question-icon flex size-[34px] shrink-0 items-center justify-center rounded-xs bg-action-primary transition duration-300 max-md:size-[30px]" aria-hidden="true">
            <FiChevronDown className="text-lg text-text-on-action transition duration-300 group-open:rotate-180 max-md:text-base" />
          </span>
        </summary>

        <div className="faq-answer max-h-0 overflow-hidden transition-[max-height,padding] duration-300 group-open:max-h-48 group-open:pb-5 max-md:group-open:pb-[18px]">
          <p className="pe-[50px] text-[15px] leading-[1.9] text-text-subtle max-md:pe-0 max-md:text-sm">{item.answer}</p>
        </div>
      </details>
    ));

  return (
    <section className="faqs section bg-surface-on-background" id="faqs">
      <div className="container-tcar">
        <SectionTitle
          smallTitle={t('faq.smallTitle')}
          title={t('faq.title')}
          subtitle={t('faq.subtitle')}
        />

        <div className="faq-grid mt-[50px] grid grid-cols-2 gap-[60px] max-lg:gap-[30px] max-md:grid-cols-1 max-md:gap-0">
          <div className="faq-column flex flex-col">{renderColumn(left)}</div>
          <div className="faq-column flex flex-col">{renderColumn(right)}</div>
        </div>
      </div>
    </section>
  );
}
