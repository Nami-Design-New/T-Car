'use client';

import type { IconType } from 'react-icons';
import { FiUser, FiCreditCard, FiBell, FiCalendar } from 'react-icons/fi';
import { PiBank } from 'react-icons/pi';

import type { AccountTab } from './tabs';

export type { AccountTab };

interface Props {
  active: AccountTab;
  onChange: (tab: AccountTab) => void;
}

const TABS: { id: AccountTab; label: string; icon: IconType }[] = [
  { id: 'profile', label: 'تعديل الحساب', icon: FiUser },
  { id: 'bookings', label: 'حجوزاتي', icon: FiCalendar },
  { id: 'wallet', label: 'المحفظة', icon: FiCreditCard },
  { id: 'bank-accounts', label: 'الحسابات البنكية', icon: PiBank },
  { id: 'notifications', label: 'الإشعارات', icon: FiBell },
];

export default function AccountSidebar({ active, onChange }: Props) {
  return (
    <aside className="account-sidebar">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            className={`account-sidebar-item ${active === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
}