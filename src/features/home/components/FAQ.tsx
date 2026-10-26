import { useTranslations } from "next-intl";
import { FiMinus, FiPlus } from "react-icons/fi";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import type { FAQItem } from "../model";

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
      <details
        key={item.id}
        name="faq"
        className="group border-stroke-light border-b"
        open={item.id === faqs[0]?.id}
      >
        <summary className="text-text-primary flex w-full cursor-pointer list-none items-center justify-between py-5.5 text-start font-medium transition duration-300 max-md:py-4.5">
          <span className="flex-1 pe-5 text-base leading-[1.7] md:text-lg">
            {item.question}
          </span>

          <span
            className="flex size-8.5 shrink-0 items-center justify-center rounded-xs transition duration-300 max-md:size-7.5"
            aria-hidden="true"
          >
            <FiPlus className="text-text-primary text-lg group-open:hidden max-md:text-base" />
            <FiMinus className="text-text-primary hidden text-lg group-open:block max-md:text-base" />
          </span>
        </summary>

        <div className="faq-answer pb-5 max-md:pb-4.5">
          <p className="text-text-subtle pe-12.5 text-sm leading-[1.9] max-md:pe-0 md:text-base">
            {item.answer}
          </p>
        </div>
      </details>
    ));

  return (
    <section className="bg-surface-on-background pb-12 md:pb-20" id="faqs">
      <div className="mx-auto w-full max-w-7xl px-2">
        <SectionTitle title={t("faq.title")} subtitle={t("faq.subtitle")} />

        <div className="faq-grid mt-8 grid grid-cols-2 gap-15 max-lg:gap-7.5 max-md:grid-cols-1 max-md:gap-0">
          <div className="faq-column flex flex-col">{renderColumn(left)}</div>
          <div className="faq-column flex flex-col">{renderColumn(right)}</div>
        </div>
      </div>
    </section>
  );
}
