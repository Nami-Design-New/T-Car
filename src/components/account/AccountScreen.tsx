'use client';

import { useState, type ReactNode } from 'react';
import AccountSidebar from '@components/account/AccountSidebar';
import type { AccountTab } from '@components/account/tabs';
import ProfileTab from '@components/account/ProfileTab';
import { WalletSection } from '@/features/wallet';
import { BankAccountsSection } from '@/features/bank-accounts';
import NotificationsTab from '@components/account/NotificationsTab';
import type { UserProfile } from '@app-types/car';

const MOCK_PROFILE: UserProfile = {
  fullName: 'أحمد عبدالله القحطاني',
  email: 'ahmed@domain.com',
  birthDate: '1993-03-15',
  phone: '+966 45 67 89',
};

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'قدم إليك العميل عرض جديد اذهب بسرعة للطلب', time: 'الآن', read: false },
  { id: '2', title: 'لقد استعدت إمكانية استخدام حسابك', time: 'الآن', read: false },
  { id: '3', title: 'يمكنك الآن الوصول إلى جميع المزايا، أحمد', time: 'قبل أسبوعين', read: true },
  { id: '4', title: 'تهانينا! تم تفعيل حسابك بنجاح، أحمد', time: 'قبل 3 أسابيع', read: true },
];

interface Props {
  initialTab?: AccountTab;
  /** Rendered on the server by the page, so this client component never imports server queries. */
  bookings: ReactNode;
}

export default function AccountScreen({ initialTab = 'profile', bookings }: Props) {
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  return (
    <section className="section account-page">
      <div className="container-tcar">
        <h1 className="account-page-title">حسابي</h1>

        <div className="account-grid">
          <AccountSidebar active={activeTab} onChange={setActiveTab} />

          <div className="account-content">
            {activeTab === 'profile' && (
              <ProfileTab
                profile={MOCK_PROFILE}
                onSave={(profile) => {
                  console.log(profile);
                }}
              />
            )}

            {activeTab === 'bookings' && bookings}

            {activeTab === 'wallet' && <WalletSection />}

            {activeTab === 'bank-accounts' && <BankAccountsSection />}

            {activeTab === 'notifications' && (
              <NotificationsTab notifications={MOCK_NOTIFICATIONS} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
