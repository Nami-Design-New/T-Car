'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { reportError } from '@/shared/lib/report';
import { ErrorState } from '@/shared/ui/ErrorState';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/** A failed account section: the sidebar stays, so the other sections remain reachable. */
export default function AccountSectionError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    reportError(error, { scope: 'account.section', digest: error.digest });
  }, [error]);

  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return <ErrorState size="section" error={error} onRetry={retry} reference={error.digest} />;
}
