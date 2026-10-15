'use client';

import { useTranslations } from 'next-intl';
import { FiAlertTriangle, FiWifiOff } from 'react-icons/fi';
import { Link, usePathname } from '@/i18n/navigation';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { cn } from '@/shared/lib/cn';
import { toAppError } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/Button';
import './ErrorState.scss';

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

  return (
    <div className={cn('error-state', `error-state--${size}`)} role="alert">
      <span className="error-state__icon" aria-hidden="true">
        {offline ? <FiWifiOff /> : <FiAlertTriangle />}
      </span>

      <Heading className="error-state__title">{title ?? t('title')}</Heading>
      <p className="error-state__description">{errorMessage(appError)}</p>
      {offline && <p className="error-state__hint">{t('offlineHint')}</p>}

      {needsSignIn ? (
        <Button asChild className="error-state__action">
          <Link href={{ pathname: '/', query: { auth: 'login', next: pathname } }}>{t('signIn')}</Link>
        </Button>
      ) : (
        onRetry && (
          <Button className="error-state__action" onClick={onRetry}>
            {tStates('retry')}
          </Button>
        )
      )}

      {reference && <p className="error-state__reference">{t('reference', { reference })}</p>}
    </div>
  );
}
