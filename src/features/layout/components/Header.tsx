import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { FiBell } from 'react-icons/fi';
import { IMAGES } from '@/shared/config/assets';
const logo = IMAGES.brandLogo;
import { Link } from '@/i18n/navigation';
import { NAV_LINKS } from '@/shared/config/site';
import AuthControl from './AuthControl';
import LanguageSwitcher from './LanguageSwitcher';
import LocationPicker from './LocationPicker';
import MobileNav from './MobileNav';

interface Props {
  hasSession: boolean;
  signedIn: boolean;
  unreadCount: number;
}

export default async function Header({ hasSession, signedIn, unreadCount }: Props) {
  const t = await getTranslations();
  const notificationCountLabel = t('account.notifications.unreadCount', {
    count: unreadCount,
  });

  return (
    <header className="header">
      <div className="container-tcar header-inner ">
        <div className="header-brand ">
          <Link href="/" className="header-logo">
            <Image src={logo} alt="T-Car" width={160} height={48} priority />
          </Link>
          <LocationPicker />
        </div>

        <MobileNav>
          <ul className="header-nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{t(link.label)}</Link>
              </li>
            ))}
          </ul>

          <div className="header-nav-actions">
            <LanguageSwitcher />
            {hasSession && (
              <Link
                href="/account/notifications"
                className="header-notifications"
                aria-label={`${t('account.notifications.title')}: ${notificationCountLabel}`}
              >
                <FiBell aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="header-notifications-count" aria-hidden="true">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <AuthControl signedIn={signedIn} loginLabel={t('nav.login')} />
          </div>
        </MobileNav>
      </div>
    </header>
  );
}
