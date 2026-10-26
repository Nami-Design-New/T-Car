'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LazyAuthModal, signOutAction } from '@/features/auth';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/ui/Button';
import { ICONS } from '@/shared/config/assets';
import UserMenu from './UserMenu';

interface Props {
  signedIn: boolean;
  loginLabel: string;
  logoutOnly?: boolean;
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

export default function AuthControl({
  signedIn,
  loginLabel,
  logoutOnly = false,
}: Props) {
  const router = useRouter();
  const userMenuT = useTranslations('layout.userMenu');
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

  if (signedIn && logoutOnly) {
    return (
      <Button
        variant="outline"
        icon={
          <Image
            src={ICONS.logout.src}
            width={ICONS.logout.width}
            height={ICONS.logout.height}
            alt=""
          />
        }
        className="w-full justify-center border-stroke-light text-status-error"
        onClick={handleLogout}
      >
        {userMenuT('logout')}
      </Button>
    );
  }

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
