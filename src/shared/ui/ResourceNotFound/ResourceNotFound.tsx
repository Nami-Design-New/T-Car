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
    <section className="section">
      <div className="container-tcar">
        <p className="not-found-eyebrow">{t('notFound.error')}</p>
        <h1>{t('notFound.title')}</h1>
        <p>{t(`errors.${resource}.notFound`)}</p>
        <Button asChild>
          <Link href={href}>{t('notFound.browseCities')}</Link>
        </Button>
      </div>
    </section>
  );
}
