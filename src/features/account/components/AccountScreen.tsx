'use client';

import { useState, type ReactNode } from 'react';
import { BankAccountsSection } from '@/features/bank-accounts';
import { NotificationsTab, type AppNotification } from '@/features/notifications';
import { WalletSection } from '@/features/wallet';
import type { AccountTab, UserProfile } from '../model';
import AccountSidebar from './AccountSidebar';
import ProfileTab from './ProfileTab';

interface Props {
  initialTab?: AccountTab;
  profile: UserProfile;
  notifications: AppNotification[];
  /** Rendered on the server by the page, so this client component never imports server queries. */
  bookings: ReactNode;
}

export default function AccountScreen({
  initialTab = 'profile',
  profile,
  notifications,
  bookings,
}: Props) {
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  return (
    <section className="section account-page">
      <div className="container-tcar">
        <h1 className="account-page-title">حسابي</h1>

        <div className="account-grid">
          <AccountSidebar active={activeTab} onChange={setActiveTab} />

          <div className="account-content">
            {activeTab === 'profile' && <ProfileTab profile={profile} />}

            {activeTab === 'bookings' && bookings}

            {activeTab === 'wallet' && <WalletSection />}

            {activeTab === 'bank-accounts' && <BankAccountsSection />}

            {activeTab === 'notifications' && (
              <NotificationsTab notifications={notifications} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
