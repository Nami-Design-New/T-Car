import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { IMAGES } from '@/shared/config/assets';
const logo = IMAGES.brandLogo;
import { Link } from '@/i18n/navigation';
import { NAV_LINKS } from '@/shared/config/site';
import AuthControl from './AuthControl';
import LanguageSwitcher from './LanguageSwitcher';
import MobileNav from './MobileNav';

export default async function Header() {
  const [session, t] = await Promise.all([auth(), getTranslations()]);

  return (
    <header className="header">
      <div className="container-tcar header-inner">
        <Link href="/" className="header-logo">
          <Image src={logo} alt="T-Car" width={160} height={48} priority />
        </Link>

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
            <AuthControl signedIn={Boolean(session?.user)} loginLabel={t('nav.login')} />
          </div>
        </MobileNav>
      </div>
    </header>
  );
}
