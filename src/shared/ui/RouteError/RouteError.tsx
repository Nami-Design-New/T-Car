'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { reportError } from '@/shared/lib/report';
import { ErrorState } from '@/shared/ui/ErrorState';

export interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  scope: string;
}

export function RouteError({ error, reset, scope }: Props) {
  const router = useRouter();

  useEffect(() => {
    reportError(error, { scope, digest: error.digest });
  }, [error, scope]);

  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return <ErrorState size="page" error={error} onRetry={retry} reference={error.digest} />;
}
