import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Menu } from './Menu';

function Example({ onLogout }: { onLogout: () => void }) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <button type="button">Account</button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Profile</Menu.Item>
        <Menu.Separator />
        <Menu.Item tone="danger" onSelect={onLogout}>
          Log out
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}

// Radix locks pointer events on the page while the menu is open.
const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('Menu', () => {
  it('opens a menu of items from its trigger', async () => {
    const user = setup();
    render(<Example onLogout={() => {}} />);
    const trigger = screen.getByRole('button', { name: 'Account' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Profile',
      'Log out',
    ]);
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toHaveClass('menu__item--danger');
  });

  it('runs an item and closes', async () => {
    const onLogout = vi.fn();
    const user = setup();
    render(<Example onLogout={onLogout} />);
    await user.click(screen.getByRole('button', { name: 'Account' }));
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens from the keyboard, moves with arrows, and returns focus on Escape', async () => {
    const user = setup();
    render(<Example onLogout={() => {}} />);
    const trigger = screen.getByRole('button', { name: 'Account' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
