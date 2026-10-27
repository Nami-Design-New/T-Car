'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AuthOnboardingModals,
  LazyAuthModal,
  signOutAction,
} from '@/features/auth';
import { useRouter } from '@/i18n/navigation';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useNotify } from '@/shared/hooks/useNotify';
import { fromActionResult } from '@/shared/lib/result';
import { Button } from '@/shared/ui/Button';
import { ICONS } from '@/shared/config/assets';
import UserMenu from './UserMenu';

interface Props {
  signedIn: boolean;
  /** Signed in at verification but the profile is still missing: the dialog opens on it. */
  profilePending?: boolean;
  loginLabel: string;
  logoutOnly?: boolean;
}

interface AuthPromptProps {
  onOpen: (next?: string) => void;
}

/**
 * Opens the dialog after middleware redirects to `?auth=login` (signed out) or
 * `?auth=register` (profile still missing; the dialog starts on the profile).
 */
function AuthPrompt({ onOpen }: AuthPromptProps) {
  const searchParams = useSearchParams();
  const auth = searchParams.get('auth');
  const rawNext = searchParams.get('next');
  const next = rawNext && /^\/(?!\/)/.test(rawNext) ? rawNext : undefined;

  useEffect(() => {
    if (auth === 'login' || auth === 'register') onOpen(next);
  }, [auth, next, onOpen]);

  return null;
}

export default function AuthControl({
  signedIn,
  profilePending = false,
  loginLabel,
  logoutOnly = false,
}: Props) {
  const router = useRouter();
  const userMenuT = useTranslations('layout.userMenu');
  const notify = useNotify();
  const errorMessage = useErrorMessage();
  const [showAuth, setShowAuth] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [locationAfterSuccess, setLocationAfterSuccess] = useState(false);
  const [authNext, setAuthNext] = useState<string | undefined>();

  const openAuth = useCallback((next?: string) => {
    setAuthNext(next);
    setShowAuth(true);
  }, []);

  const handleLogout = async () => {
    const result = fromActionResult(await signOutAction());
    if (result.ok) notify.success(result.message);
    else notify.error(result.error.kind === 'validation' && result.error.serverMessage
      ? result.error.serverMessage
      : errorMessage(result.error));
    router.refresh();
  };

  const finishOnboarding = useCallback(() => {
    setShowLocation(false);
    if (authNext) router.replace(authNext);
    router.refresh();
  }, [authNext, router]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    if (locationAfterSuccess) {
      setShowLocation(true);
    } else {
      finishOnboarding();
    }
  }, [finishOnboarding, locationAfterSuccess]);

  const onboardingModals = (
    <AuthOnboardingModals
      successOpen={showSuccess}
      locationOpen={showLocation}
      onSuccessClose={handleSuccessClose}
      onLocationClose={finishOnboarding}
    />
  );

  if (signedIn && logoutOnly) {
    return (
      <>
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
        {onboardingModals}
      </>
    );
  }

  if (signedIn)
    return (
      <>
        <UserMenu onLogout={handleLogout} />
        {onboardingModals}
      </>
    );

  return (
    <>
      <Button size="sm" onClick={() => openAuth()}>
        {loginLabel}
      </Button>

      {showAuth && (
        <LazyAuthModal
          show={true}
          onHide={() => setShowAuth(false)}
          next={authNext}
          initialStep={profilePending ? 'register' : 'login'}
          onRegistrationSuccess={(locationNext) => {
            setLocationAfterSuccess(locationNext);
            setShowSuccess(true);
          }}
          onLocationRequired={() => setShowLocation(true)}
        />
      )}

      {onboardingModals}

      <Suspense fallback={null}>
        <AuthPrompt onOpen={openAuth} />
      </Suspense>
    </>
  );
}
