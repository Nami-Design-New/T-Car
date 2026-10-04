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
  it('explains which resource is missing', () => {
    renderWithIntl(<ResourceNotFound resource="cars" href="/cars" />);
    expect(screen.getByText('Error 404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: "Looks like we're lost" })
    ).toBeInTheDocument();
    expect(screen.getByText('This car is not available or does not exist.')).toBeInTheDocument();
  });

  it('links back to the matching list', () => {
    const { unmount } = renderWithIntl(<ResourceNotFound resource="cars" href="/cars" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/cars');
    unmount();

    renderWithIntl(<ResourceNotFound resource="bookings" href="/account/bookings" />);
    expect(screen.getByText('Booking not found.')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/account/bookings');
  });
});
