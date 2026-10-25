'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/Button';

type Resource = 'cars' | 'cities' | 'bookings';

export interface Props {
  resource: Resource;
  href: '/cars' | '/cities' | '/account/bookings';
}

export function ResourceNotFound({ resource, href }: Props) {
  const t = useTranslations();

  return (
    <section className="py-20 max-md:py-12">
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <p className="mb-4 inline-flex items-center justify-center rounded-full bg-surface-card-primary px-3.5 py-1.5 text-xs font-bold text-action-primary">
          {t('notFound.error')}
        </p>
        <h1 className="mb-3 text-3xl font-extrabold text-text-primary">
          {t('notFound.title')}
        </h1>
        <p className="mb-8 text-base leading-[1.8] text-text-subtle">
          {t(`errors.${resource}.notFound`)}
        </p>
        <Button asChild>
          <Link href={href}>{t('notFound.browseCities')}</Link>
        </Button>
      </div>
    </section>
  );
}
