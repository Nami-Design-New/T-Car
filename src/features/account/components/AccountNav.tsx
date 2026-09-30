'use client';

import type { IconType } from 'react-icons';
import { FiBell, FiCalendar, FiCreditCard, FiUser } from 'react-icons/fi';
import { PiBank } from 'react-icons/pi';
import { Link, usePathname } from '@/i18n/navigation';
import { accountSectionPath, type AccountTab } from '../model';

const SECTIONS: { id: AccountTab; label: string; icon: IconType }[] = [
  { id: 'profile', label: 'تعديل الحساب', icon: FiUser },
  { id: 'bookings', label: 'حجوزاتي', icon: FiCalendar },
  { id: 'wallet', label: 'المحفظة', icon: FiCreditCard },
  { id: 'bank-accounts', label: 'الحسابات البنكية', icon: PiBank },
  { id: 'notifications', label: 'الإشعارات', icon: FiBell },
];

/** The account sections as links (doc 5): each one is its own route. */
export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="account-sidebar" aria-label="حسابي">
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
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
