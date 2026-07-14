'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX } from 'react-icons/fi';
import Button from '@components/common/Button';
import LanguageSwitcher from '@components/layout/LanguageSwitcher';
import UserMenu from '@components/layout/UserMenu';
import { NAV_LINKS, SITE_NAME } from '@constants/index';
import Image from 'next/image';
import logo from '@assets/images/fav.svg';
import AuthModal from '@/components/auth/AuthModal';

export default function Header() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
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

            {/* {isLoggedIn ? (
              <UserMenu userName="أحمد محمد" onLogout={handleLogout} />
            ) : (
              <Button size="sm" onClick={() => setShowAuth(true)}>
                {t('nav.login')}
              </Button>
            )} */}
              <UserMenu  onLogout={handleLogout} />
        
              <Button size="sm" onClick={() => setShowAuth(true)}>
                {t('nav.login')}
              </Button>
          </div>
        </nav>

        <button
          className="header-toggle"
          aria-label="Toggle menu"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        <AuthModal show={showAuth} onHide={() => setShowAuth(false)} />
      </div>
    </header>
  );
}