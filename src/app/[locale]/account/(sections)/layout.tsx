import type { ReactNode } from 'react';
import { AccountLayout } from '@/features/account';

/**
 * The account sections share the title and the section links. Booking details
 * (account/bookings/[id]) sit outside this group and keep their full-width page.
 */
export default function SectionsLayout({ children }: { children: ReactNode }) {
  return <AccountLayout>{children}</AccountLayout>;
}
