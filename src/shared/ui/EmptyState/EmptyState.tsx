import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Illustration, type IllustrationName } from '@/shared/ui/Illustration';
import './EmptyState.scss';

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

  return (
    <div className={cn('empty-state', `empty-state--${size}`, className)}>
      {illustration && size !== 'inline' && (
        <Illustration name={illustration} className="empty-state__illustration" />
      )}
      <Heading className="empty-state__title">{title}</Heading>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
