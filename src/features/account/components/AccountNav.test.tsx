import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccountNav from './AccountNav';

let pathname = '/account/profile';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => pathname,
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AccountNav', () => {
  it('links every account section', () => {
    render(<AccountNav />);
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/account/profile',
      '/account/bookings',
      '/account/wallet',
      '/account/bank-accounts',
      '/account/notifications',
    ]);
  });

  it('marks the current section', () => {
    pathname = '/account/wallet';
    render(<AccountNav />);
    const wallet = screen.getByRole('link', { name: 'المحفظة' });
    expect(wallet).toHaveAttribute('aria-current', 'page');
    expect(wallet).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'تعديل الحساب' })).not.toHaveAttribute('aria-current');
  });

  it('keeps a section active on its sub-pages', () => {
    pathname = '/account/bookings/3';
    render(<AccountNav />);
    expect(screen.getByRole('link', { name: 'حجوزاتي' })).toHaveAttribute('aria-current', 'page');
  });
});
