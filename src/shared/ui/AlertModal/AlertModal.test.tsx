import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { AlertModal } from './AlertModal';

describe('AlertModal', () => {
  it('renders the account confirmation actions', async () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <AlertModal
        open
        title="Delete account"
        description="This cannot be undone."
        showButtons
        primaryButtonText="Delete"
        secondaryButtonText="Keep"
        onPrimary={onPrimary}
        onSecondary={onSecondary}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Keep' }));
    expect(onPrimary).toHaveBeenCalledOnce();
    expect(onSecondary).toHaveBeenCalledOnce();
  });
});
