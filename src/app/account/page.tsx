'use client';

import { useState } from 'react';
import AccountSidebar, { AccountTab } from '@components/account/AccountSidebar';
import ProfileTab from '@components/account/ProfileTab';
import WalletTab from '@components/account/WalletTab';
import NotificationsTab from '@components/account/NotificationsTab';
import BookingsTab from '@components/account/BookingsTab';
import type { UserProfile, UserBooking } from '@app-types/car';

import car1 from '@assets/images/car1.jpg';

const MOCK_PROFILE: UserProfile = {
  fullName: 'أحمد عبدالله القحطاني',
  email: 'ahmed@domain.com',
  birthDate: '1993-03-15',
  phone: '+966 45 67 89',
};

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'topup' as const, title: 'شحن', amount: 2500, reference: '7A3D6D', date: '2025 ديسمبر 1 - 4:50Am' },
  { id: '2', type: 'refund' as const, title: 'استرداد', amount: 2500, reference: '7A3D6D', date: '2025 ديسمبر 1 - 4:50Am' },
  { id: '3', type: 'payment' as const, title: 'دفع', amount: 2500, reference: '7A3D6D', date: '2025 ديسمبر 1 - 4:50Am' },
];

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'قدم إليك العميل عرض جديد اذهب بسرعة للطلب', time: 'الآن', read: false },
  { id: '2', title: 'لقد استعدت إمكانية استخدام حسابك', time: 'الآن', read: false },
  { id: '3', title: 'يمكنك الآن الوصول إلى جميع المزايا، أحمد', time: 'قبل أسبوعين', read: true },
  { id: '4', title: 'تهانينا! تم تفعيل حسابك بنجاح، أحمد', time: 'قبل 3 أسابيع', read: true },
];

const MOCK_BOOKINGS: UserBooking[] = [
  {
    id: '1', carName: 'ماليبو', carBrand: 'شيفروليه', carImage: car1, year: 2022,
    rating: 4.4, showroom: 'معرض القدس', status: 'active', statusLabel: 'حالي',
    dateLabel: '30 يونيو 2026، 11:46 م',
  },

  {
    id: '2', carName: 'ألتيما', carBrand: 'نيسان', carImage: car1, year: 2022,
    rating: 4.5, showroom: 'معرض الخليج', status: 'active', statusLabel: 'حالي',
    dateLabel: '18 يوليو 2026، 01:15 م',
  },
  {
    id: '3', carName: 'أكورد', carBrand: 'هوندا', carImage: car1, year: 2023,
    rating: 4.6, showroom: 'معرض العروبة', status: 'completed', statusLabel: 'مكتمل',
    dateLabel: '30 يونيو 2026، 11:46 م',
  },
  {
    id: '4', carName: 'مازدا 6', carBrand: 'مازدا', carImage: car1, year: 2024,
    rating: 4.8, showroom: 'معرض النخبة', status: 'completed', statusLabel: 'مكتمل',
    dateLabel: '8 أبريل 2026، 12:00 م',
  },
  {
    id: '5', carName: 'إمبالا', carBrand: 'شيفروليه', carImage: car1, year: 2021,
    rating: 4.2, showroom: 'معرض القدس', status: 'completed', statusLabel: 'مكتمل',
    dateLabel: '22 مارس 2026، 07:45 م',
  },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');

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
                  // TODO: نداء API حقيقي لحفظ بيانات الملف الشخصي
                  console.log(profile);
                }}
              />
            )}

            {activeTab === 'bookings' && <BookingsTab bookings={MOCK_BOOKINGS} />}

            {activeTab === 'wallet' && (
              <WalletTab
                balance={2500}
                transactions={MOCK_TRANSACTIONS}
                onTopUp={() => {
                  // TODO: فتح مودال شحن الرصيد الحقيقي
                }}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab notifications={MOCK_NOTIFICATIONS} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}