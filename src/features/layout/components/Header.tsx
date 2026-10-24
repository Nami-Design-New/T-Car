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
    <header className="header sticky top-0 z-[100] border-b border-black/5 bg-surface-background/95 shadow-[0_4px_20px_rgba(30,30,30,0.06)] backdrop-blur-[12px]">
      <div className="container-tcar header-inner flex h-20 items-center justify-between">
        <div className="header-brand flex min-w-0 items-center gap-[clamp(12px,2vw,24px)]">
          <Link href="/" className="header-logo group flex min-w-0 flex-[0_1_clamp(108px,13vw,160px)] items-center">
            <Image src={logo} alt="T-Car" width={160} height={48} priority className="h-auto w-full transition duration-300 group-hover:scale-105" />
          </Link>
          <LocationPicker />
        </div>

        <MobileNav>
            <ul className="header-nav-list flex flex-1 basis-auto items-center justify-center gap-4 p-0 [list-style:none] max-lg:w-full max-lg:flex-none max-lg:flex-col max-lg:items-start max-lg:justify-start max-lg:gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="relative font-semibold text-text-primary transition duration-300 hover:text-action-primary">
                  {t(link.label)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="header-nav-actions flex items-center gap-3 max-lg:mt-8 max-lg:w-full max-lg:flex-col max-lg:items-stretch">
            <LanguageSwitcher />
            {hasSession && (
              <Link
                href="/account/notifications"
                className="header-notifications relative grid h-11 w-11 place-items-center rounded-md border border-stroke-light text-text-primary transition duration-300 hover:border-action-primary hover:bg-surface-card-primary hover:text-action-primary focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-2 max-lg:w-full max-lg:justify-start max-lg:gap-2.5 max-lg:px-3"
                aria-label={`${t('account.notifications.title')}: ${notificationCountLabel}`}
              >
                <FiBell aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="header-notifications-count absolute -end-1.5 -top-1.5 grid min-w-[19px] place-items-center rounded-full border-2 border-surface-background bg-status-error px-1 text-[10px] font-extrabold leading-none text-text-on-action">
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
