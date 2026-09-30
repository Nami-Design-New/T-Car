import { getTranslations } from 'next-intl/server';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from './Skeleton';
import './PageSkeleton.scss';

interface Props {
  /**
   * `page`: a full content area (heading and a card grid) inside the site
   * layout. `section`: the inside of a layout that already draws its own
   * frame, e.g. an account section next to the sidebar.
   */
  variant?: 'page' | 'section';
}

/**
 * Generic loading skeleton for a route segment's loading.tsx (doc 6). Hidden
 * from assistive technology except a visually hidden "Loading…" label.
 * Screens can swap in layout-matched skeletons later.
 */
export async function PageSkeleton({ variant = 'page' }: Props) {
  const t = await getTranslations('states');

  const cards = (
    <div className="page-skeleton__grid">
      {Array.from({ length: variant === 'page' ? 6 : 3 }, (_, index) => (
        <div key={index} className="page-skeleton__card">
          <Skeleton shape="rect" aspectRatio="16/10" />
          <Skeleton width="70%" height={18} />
          <Skeleton width="45%" height={14} />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={cn('page-skeleton', `page-skeleton--${variant}`, variant === 'page' && 'section')}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="visually-hidden">{t('loading')}</span>

      {variant === 'page' ? (
        <div className="container-tcar">
          <Skeleton width="40%" height={32} />
          <Skeleton width="60%" height={16} className="page-skeleton__subtitle" />
          {cards}
        </div>
      ) : (
        <>
          <Skeleton width="50%" height={24} />
          {cards}
        </>
      )}
    </div>
  );
}
