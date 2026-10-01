import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import type { UserBooking } from '../model';
import BookingsTab from './BookingsTab';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, scroll: _scroll, ...props }: { href: string; children: React.ReactNode; scroll?: boolean }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const booking = (id: string, status: UserBooking['status']): UserBooking => ({
  id,
  carName: `Car ${id}`,
  carBrand: 'Brand',
  carImage: '/car.jpg',
  showroom: 'Showroom',
  year: 2024,
  rating: 4.5,
  status,
  statusLabel: status,
  dateLabel: 'today',
});

const BOOKINGS = [booking('1', 'current'), booking('2', 'upcoming'), booking('3', 'completed')];

describe('BookingsTab', () => {
  it('shows the active list with its link marked current', () => {
    renderWithIntl(<BookingsTab bookings={BOOKINGS} status="active" />);
    const nav = screen.getByRole('navigation', { name: 'My bookings' });
    const [activeLink, pastLink] = within(nav).getAllByRole('link');
    expect(activeLink).toHaveAttribute('href', '/account/bookings');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveTextContent('2');
    expect(pastLink).toHaveAttribute('href', '/account/bookings?status=past');
    expect(pastLink).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Brand Car 1')).toBeInTheDocument();
    expect(screen.queryByText('Brand Car 3')).not.toBeInTheDocument();
  });

  it('shows the past list for status=past', () => {
    renderWithIntl(<BookingsTab bookings={BOOKINGS} status="past" />);
    expect(screen.getByRole('link', { name: /Past/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Brand Car 3')).toBeInTheDocument();
    expect(screen.queryByText('Brand Car 1')).not.toBeInTheDocument();
  });

  it('shows the empty state when the chosen list is empty', () => {
    renderWithIntl(<BookingsTab bookings={[booking('1', 'current')]} status="past" />);
    expect(screen.getByRole('heading', { name: 'No bookings yet' })).toBeInTheDocument();
    expect(screen.getByText('No past bookings')).toBeInTheDocument();
  });
});
