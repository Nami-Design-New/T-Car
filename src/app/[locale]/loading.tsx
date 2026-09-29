import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@/shared/ui/Skeleton';
import './loading.scss';

/**
 * Generic content-area skeleton while a page loads. It renders inside the
 * layout, so the header and footer stay visible and usable (doc 6 step 2);
 * the full-screen branded Loader is kept for real full-page cases only.
 * Segments get their own layout-matched skeletons as the routes are split.
 */
export default async function Loading() {
  const t = await getTranslations('states');

  return (
    <section className="section page-skeleton" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">{t('loading')}</span>

      <div className="container-tcar">
        <Skeleton width="40%" height={32} />
        <Skeleton width="60%" height={16} className="page-skeleton__subtitle" />

        <div className="page-skeleton__grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="page-skeleton__card">
              <Skeleton shape="rect" aspectRatio="16/10" />
              <Skeleton width="70%" height={18} />
              <Skeleton width="45%" height={14} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
