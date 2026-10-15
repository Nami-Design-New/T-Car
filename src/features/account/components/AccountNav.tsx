'use client';

import type { IconType } from 'react-icons';
import { useTranslations } from 'next-intl';
import { FiBell, FiCalendar, FiCreditCard, FiUser } from 'react-icons/fi';
import { PiBank } from 'react-icons/pi';
import { Link, usePathname } from '@/i18n/navigation';
import { accountSectionPath, type AccountTab } from '../model';

const SECTIONS: { id: AccountTab; label: string; icon: IconType }[] = [
  { id: 'profile', label: 'profile', icon: FiUser },
  { id: 'bookings', label: 'bookings', icon: FiCalendar },
  { id: 'wallet', label: 'wallet', icon: FiCreditCard },
  { id: 'bank-accounts', label: 'bankAccounts', icon: PiBank },
  { id: 'notifications', label: 'notifications', icon: FiBell },
];

/** The account sections as links (doc 5): each one is its own route. */
export default function AccountNav() {
  const t = useTranslations('account.nav');
  const pathname = usePathname();

  return (
    <nav className="account-sidebar" aria-label={t('account')}>
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const href = accountSectionPath(id);
        // A section stays active on its sub-pages (e.g. /account/bookings/[id]).
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={id}
            href={href}
            className={`account-sidebar-item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{t(label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
