import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { ResourceNotFound } from './ResourceNotFound';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ResourceNotFound', () => {
  it('shows the state illustration above the texts', () => {
    const { container } = renderWithIntl(
      <ResourceNotFound resource="cars" href="/cars" />
    );
    expect(container.querySelector('.illustration')).toBeInTheDocument();
  });

  it('explains which resource is missing', () => {
    renderWithIntl(<ResourceNotFound resource="cars" href="/cars" />);
    expect(screen.getByText('Error 404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: "Looks like we're lost" })
    ).toBeInTheDocument();
    expect(screen.getByText('This car is not available or does not exist.')).toBeInTheDocument();
  });

  it('links back to the matching list with the matching label', () => {
    const { unmount } = renderWithIntl(<ResourceNotFound resource="cars" href="/cars" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/cars');
    expect(screen.getByRole('link', { name: 'Browse Cars' })).toBeInTheDocument();
    unmount();

    const { unmount: unmountCities } = renderWithIntl(
      <ResourceNotFound resource="cities" href="/cities" />
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/cities');
    expect(screen.getByRole('link', { name: 'Browse Cities' })).toBeInTheDocument();
    unmountCities();

    renderWithIntl(<ResourceNotFound resource="bookings" href="/account/bookings" />);    expect(screen.getByText('Booking not found.')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/account/bookings');
    expect(screen.getByRole('link', { name: 'Browse Bookings' })).toBeInTheDocument();
  });
});
