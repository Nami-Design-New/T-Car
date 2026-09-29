'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LazyAuthModal, signOutAction } from '@/features/auth';
import { useRouter } from '@/i18n/navigation';
import Button from '@/shared/ui/Button';
import UserMenu from './UserMenu';

interface Props {
  signedIn: boolean;
  loginLabel: string;
}

interface AuthPromptProps {
  onOpen: (next?: string) => void;
}

/** Opens the sign-in dialog after middleware redirects to `?auth=login`. */
function AuthPrompt({ onOpen }: AuthPromptProps) {
  const searchParams = useSearchParams();
  const auth = searchParams.get('auth');
  const rawNext = searchParams.get('next');
  const next = rawNext && /^\/(?!\/)/.test(rawNext) ? rawNext : undefined;

  useEffect(() => {
    if (auth === 'login') onOpen(next);
  }, [auth, next, onOpen]);

  return null;
}

export default function AuthControl({ signedIn, loginLabel }: Props) {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [authNext, setAuthNext] = useState<string | undefined>();

  const openAuth = useCallback((next?: string) => {
    setAuthNext(next);
    setShowAuth(true);
  }, []);

  const handleLogout = async () => {
    await signOutAction();
    router.refresh();
  };

  if (signedIn) return <UserMenu onLogout={handleLogout} />;

  return (
    <>
      <Button size="sm" onClick={() => openAuth()}>
        {loginLabel}
      </Button>

      {showAuth && (
        <LazyAuthModal show={true} onHide={() => setShowAuth(false)} next={authNext} />
      )}

      <Suspense fallback={null}>
        <AuthPrompt onOpen={openAuth} />
      </Suspense>
    </>
  );
}
