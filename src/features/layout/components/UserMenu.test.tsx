import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import UserMenu from './UserMenu';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={`/en${href}`} {...props}>
      {children}
    </a>
  ),
}));

const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('UserMenu', () => {
  it('links to the account page and logs out from the menu', async () => {
    const onLogout = vi.fn();
    const user = setup();
    renderWithIntl(<UserMenu onLogout={onLogout} />);

    const trigger = screen.getByRole('button', { name: 'حسابي' });
    expect(trigger.querySelector('.user-menu-chevron')).not.toHaveClass('open');

    await user.click(trigger);
    expect(trigger.querySelector('.user-menu-chevron')).toHaveClass('open');
    expect(screen.getByRole('menuitem', { name: 'حسابي' })).toHaveAttribute('href', '/en/account');

    await user.click(screen.getByRole('menuitem', { name: 'تسجيل الخروج' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
