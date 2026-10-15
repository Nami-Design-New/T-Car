'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { reportError } from '@/shared/lib/report';
import { ErrorState } from '@/shared/ui/ErrorState';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Fallback for any page under [locale]. It sits below the layout, so the header
 * and footer stay usable. Server errors arrive without their message in
 * production; the digest links the screen to the server log.
 */
export default function RouteError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    reportError(error, { scope: 'route', digest: error.digest });
  }, [error]);

  // reset() alone only re-renders on the client; refresh re-runs the server render.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <section className="section">
      <div className="container-tcar">
        <ErrorState size="page" error={error} onRetry={retry} reference={error.digest} />
      </div>
    </section>
  );
}
