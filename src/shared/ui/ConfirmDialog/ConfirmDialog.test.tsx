import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import { ConfirmDialog } from './ConfirmDialog';

function renderConfirmDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  renderWithIntl(
    <ConfirmDialog
      open
      title="Delete bank account?"
      description="This cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />
  );
  return { onConfirm, onCancel, user };
}

describe('ConfirmDialog', () => {
  it('renders an accessible destructive confirmation and calls its actions', async () => {
    const { onCancel, onConfirm, user } = renderConfirmDialog({ tone: 'danger' });
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('This cannot be undone.');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('prevents cancellation while pending', async () => {
    const { onCancel, user } = renderConfirmDialog({ pending: true });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });
});
