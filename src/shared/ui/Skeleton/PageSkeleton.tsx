import { getTranslations } from 'next-intl/server';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from './Skeleton';

export interface Props {
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
    <div
      className={cn(
        'mt-10 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6',
        variant === 'section' && 'mt-6',
      )}
    >
      {Array.from({ length: variant === 'page' ? 6 : 3 }, (_, index) => (
        <div key={index} className="flex flex-col gap-4">
          <Skeleton shape="rect" aspectRatio="16/10" />
          <Skeleton width="70%" height={18} />
          <Skeleton width="45%" height={14} />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        variant === 'page' && 'min-h-[60vh] py-20 max-md:py-12',
        variant === 'section' && 'p-6',
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{t('loading')}</span>

      {variant === 'page' ? (
        <div className="mx-auto w-full max-w-[1280px] px-4">
          <Skeleton width="40%" height={32} />
          <Skeleton width="60%" height={16} className="mt-4" />
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
