import type { ReactNode } from 'react';
import { AccountLayout } from '@/features/account';
import { getPoints } from '@/features/points/queries';

/**
 * The account sections share the title and the section links. Booking details
 * (account/bookings/[id]) sit outside this group and keep their full-width page.
 */
export default async function SectionsLayout({ children }: { children: ReactNode }) {
  const { summary } = await getPoints();

  return <AccountLayout pointsSummary={summary}>{children}</AccountLayout>;
}
