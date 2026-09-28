'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FiMenu, FiX } from 'react-icons/fi';
import Button from '@/shared/ui/Button';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher/LanguageSwitcher';
import UserMenu from '@components/layout/UserMenu';
import { NAV_LINKS, SITE_NAME } from '@/shared/config/site';
import Image from 'next/image';
import logo from '@assets/images/logo.png';
import { AuthModal, signOutAction, type AuthUser } from '@/features/auth';

interface Props {
  /** From the server session; null when signed out. */
  user: AuthUser | null;
}

/**
 * Opens the sign-in dialog for links like /?auth=login&next=/account (the
 * middleware sends signed-out visitors of protected pages there). Separate so
 * useSearchParams sits inside its own Suspense boundary.
 */
function AuthPrompt({ onOpen }: { onOpen: (next?: string) => void }) {
  const searchParams = useSearchParams();
  const auth = searchParams.get('auth');
  const next = searchParams.get('next') ?? undefined;

  useEffect(() => {
    if (auth === 'login') onOpen(next);
  }, [auth, next, onOpen]);

  return null;
}

export default function Header({ user }: Props) {
  const t = useTranslations();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authNext, setAuthNext] = useState<string | undefined>();

  const openAuth = useCallback((next?: string) => {
    setAuthNext(next);
    setShowAuth(true);
  }, []);

  const handleLogout = async () => {
    await signOutAction();
    // Re-render with no session; protected pages redirect through the middleware.
    router.refresh();
  };

  return (
    <header className="header">
      <div className="container-tcar header-inner">
        <Link href="/" className="header-logo">
          <Image src={logo} alt="T-Car" width={160} height={48} priority />
        </Link>

        <nav className={`header-nav ${isOpen ? 'is-open' : ''}`}>
          <ul className="header-nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setIsOpen(false)}>
                  {t(link.label)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="header-nav-actions">
            <LanguageSwitcher />

            {user ? (
              <UserMenu onLogout={handleLogout} />
            ) : (
              <Button size="sm" onClick={() => openAuth()}>
                {t('nav.login')}
              </Button>
            )}
          </div>
        </nav>

        <button
          className="header-toggle"
          aria-label="Toggle menu"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        <AuthModal show={showAuth} onHide={() => setShowAuth(false)} next={authNext} />

        {!user && (
          <Suspense fallback={null}>
            <AuthPrompt onOpen={openAuth} />
          </Suspense>
        )}
      </div>
    </header>
  );
}
