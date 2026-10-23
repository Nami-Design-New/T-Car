import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Illustration, type IllustrationName } from '@/shared/ui/Illustration';

export interface Props {
  title: string;
  description?: string;
  /** e.g. <Button asChild><Link href="/cars">…</Link></Button> */
  action?: ReactNode;
  illustration?: IllustrationName | null;
  size?: 'page' | 'section' | 'inline';
  className?: string;
}

/**
 * A successful result with nothing in it (doc 6). Never used for a failure or
 * for "not loaded yet": those are ErrorState and Skeleton.
 */
export function EmptyState({
  title,
  description,
  action,
  illustration = 'empty',
  size = 'section',
  className,
}: Props) {
  const Heading = size === 'inline' ? 'p' : 'h3';
  const sizeClasses = {
    page: 'empty-state--page min-h-[50vh] justify-center px-4 py-10',
    section: 'empty-state--section px-4 py-6',
    inline: 'empty-state--inline p-3',
  };

  return (
    <div
      className={cn(
        'empty-state flex flex-col items-center gap-2 text-center text-text-primary',
        sizeClasses[size],
        className,
      )}
    >
      {illustration && size !== 'inline' && (
        <Illustration
          name={illustration}
          className={cn(
            'empty-state__illustration min-h-[120px] w-40',
            size === 'page' && 'w-[220px]',
          )}
        />
      )}
      <Heading
        className={cn(
          'empty-state__title m-0 text-[1.1rem] font-semibold',
          size === 'inline' && 'text-[0.95rem] font-medium text-text-subtle',
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="empty-state__description m-0 max-w-lg text-[0.9rem] text-text-subtle">
          {description}
        </p>
      )}
      {action && <div className="empty-state__action mt-2">{action}</div>}
    </div>
  );
}
