import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import type { OrderListItem } from '@/features/orders';
import type { Page } from '@/shared/lib/pagination';
import BookingsTab from './BookingsTab';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, scroll: _scroll, ...props }: { href: string; children: React.ReactNode; scroll?: boolean }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const booking = (id: string, status: OrderListItem['status']): OrderListItem => ({
  id,
  carName: `Brand Car ${id}`,
  carImage: '/car.jpg',
  carYear: 2024,
  companyName: 'Showroom',
  companyLogo: null,
  companyRate: 4.5,
  date: '2026-06-30 23:46',
  status,
  lateHours: status === 'late' ? 3 : null,
  isRated: false,
  myRating: { companyRate: null, driverRate: null },
});

const page = (items: OrderListItem[]): Page<OrderListItem> => ({ items, page: 1, lastPage: 1, total: items.length });

describe('BookingsTab', () => {
  it('shows the active page with its link marked current', () => {
    renderWithIntl(
      <BookingsTab initialPage={page([booking('1', 'current')])} status="active" />
    );
    const nav = screen.getByRole('navigation', { name: 'My bookings' });
    const [activeLink, pastLink] = within(nav).getAllByRole('link');
    expect(activeLink).toHaveAttribute('href', '/account/bookings');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(pastLink).toHaveAttribute('href', '/account/bookings?status=past');
    expect(pastLink).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Brand Car 1')).toBeInTheDocument();
  });

  it('shows the past page for status=past', () => {
    renderWithIntl(
      <BookingsTab initialPage={page([booking('3', 'complete')])} status="past" />
    );
    expect(screen.getByRole('link', { name: /Past/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Brand Car 3')).toBeInTheDocument();
  });

  it('restarts the list from the new page when the tab changes', () => {
    const { rerender } = renderWithIntl(
      <BookingsTab initialPage={page([booking('1', 'current')])} status="active" />
    );
    rerender(<BookingsTab initialPage={page([booking('3', 'complete')])} status="past" />);
    expect(screen.getByText('Brand Car 3')).toBeInTheDocument();
    expect(screen.queryByText('Brand Car 1')).not.toBeInTheDocument();
  });

  it('shows the empty state when the chosen list is empty', () => {
    renderWithIntl(<BookingsTab initialPage={page([])} status="past" />);
    expect(screen.getByRole('heading', { name: 'No bookings yet' })).toBeInTheDocument();
    expect(screen.getByText('No past bookings')).toBeInTheDocument();
  });
});
