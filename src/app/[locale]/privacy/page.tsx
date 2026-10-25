'use client';
import { useTranslations } from 'next-intl';
import { SectionTitle } from '@/shared/ui/SectionTitle';
export default function PrivacyPage() {
  const t = useTranslations();
  const sections = Array.from({ length: 5 }, (_, index) => ({
    title: t(`legalContent.privacy.${index}.title`),
    content: t(`legalContent.privacy.${index}.content`),
  }));
  return (
    <section className="py-20 max-md:py-12">
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <SectionTitle
          smallTitle={t('privacy.smallTitle')}
          title={t('privacy.title')}
          subtitle={t('privacy.subtitle')}
        />
        <div className="mx-auto flex max-w-[900px] flex-col gap-[22px]">
          {sections.map((section, index) => (
            <article
              className="flex items-start gap-[22px] rounded-xl border border-stroke-light bg-surface-elevated p-[26px] transition duration-300 hover:-translate-y-1 hover:border-action-primary/25 hover:shadow-[0_18px_40px_rgba(30,30,30,0.08)] max-md:flex-col max-md:gap-4"
              key={index}
            >
              <div className="grid size-[54px] shrink-0 place-items-center rounded-full bg-surface-card-primary text-base font-bold text-action-primary max-md:size-[46px]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="min-w-0 flex-1 [&>h3]:mb-2.5 [&>h3]:text-[1.15rem] [&>h3]:font-bold [&>h3]:text-text-primary [&>p]:m-0 [&>p]:leading-[1.9] [&>p]:text-text-subtle">
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
