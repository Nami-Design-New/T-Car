'use client';

import { useTranslations } from 'next-intl';
import { FiAlertTriangle, FiWifiOff } from 'react-icons/fi';
import { Link, usePathname } from '@/i18n/navigation';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { cn } from '@/shared/lib/cn';
import { toAppError } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/Button';

export interface Props {
  /** Any error; an AppError picks its message from errors.<code|kind>. */
  error: unknown;
  /** Shows a "Try again" button when given. */
  onRetry?: () => void;
  size?: 'page' | 'section' | 'inline';
  /** Overrides the generic "Something went wrong" title. */
  title?: string;
  /** Next.js error digest, shown so support can find the server log. */
  reference?: string;
}

/** Failed-load state (doc 6): message, retry, a sign-in action for 401s, an offline hint. */
export function ErrorState({ error, onRetry, size = 'section', title, reference }: Props) {
  const t = useTranslations('states.error');
  const tStates = useTranslations('states');
  const errorMessage = useErrorMessage();
  const pathname = usePathname();

  const appError = toAppError(error);
  const offline = appError.kind === 'network';
  const needsSignIn = appError.kind === 'unauthorized';
  const Heading = size === 'inline' ? 'p' : 'h2';
  const sizeClasses = {
    page: 'error-state--page min-h-[50vh] justify-center px-4 py-10',
    section: 'error-state--section px-4 py-10',
    inline: 'error-state--inline flex-row flex-wrap justify-center p-4',
  };

  return (
    <div
      className={cn(
        'error-state flex flex-col items-center gap-2 text-center text-text-primary',
        sizeClasses[size],
      )}
      role="alert"
    >
      <span
        className={cn(
          'error-state__icon inline-flex size-14 items-center justify-center rounded-full bg-status-error-background text-[26px] text-status-error',
          size === 'inline' && 'size-8 text-base',
        )}
        aria-hidden="true"
      >
        {offline ? <FiWifiOff /> : <FiAlertTriangle />}
      </span>

      <Heading
        className={cn(
          'error-state__title m-0 text-xl font-semibold',
          size === 'page' && 'text-2xl',
          size === 'inline' && 'text-base',
        )}
      >
        {title ?? t('title')}
      </Heading>
      <p className="error-state__description m-0 max-w-xl text-text-subtle">
        {errorMessage(appError)}
      </p>
      {offline && (
        <p className="error-state__hint m-0 max-w-xl text-sm text-text-subtle">
          {t('offlineHint')}
        </p>
      )}

      {needsSignIn ? (
        <Button asChild className="error-state__action mt-2">
          <Link href={{ pathname: '/', query: { auth: 'login', next: pathname } }}>{t('signIn')}</Link>
        </Button>
      ) : (
        onRetry && (
          <Button className="error-state__action mt-2" onClick={onRetry}>
            {tStates('retry')}
          </Button>
        )
      )}

      {reference && (
        <p className="error-state__reference m-0 max-w-xl text-sm text-text-placeholder [direction:ltr]">
          {t('reference', { reference })}
        </p>
      )}
    </div>
  );
}
