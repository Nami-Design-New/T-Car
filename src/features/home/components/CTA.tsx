import { Button } from '@/shared/ui/Button';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function CTA() {
  const t = await getTranslations('homeCta');

  return (
    <section className="cta">
      <div className="container-tcar">
        <div className="cta_content">
          <div className="cta_pattern" />

          <div className="cta_text">
            <h3>{t('title')}</h3>

            <p>{t('description')}</p>

            <Link href="/join-us">
              <Button size="lg" className="bg-white text-primary border-0">
                {t('cta')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
