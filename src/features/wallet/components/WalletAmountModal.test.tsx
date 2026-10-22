import { screen, within } from '@testing-library/react';
import { AppError } from '@/shared/lib/errors';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import WalletAmountModal from './WalletAmountModal';

function renderModal(overrides: Partial<React.ComponentProps<typeof WalletAmountModal>> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  renderWithIntl(
    <WalletAmountModal
      open
      title="اشحن المحفظة"
      submitLabel="شحن"
      min={10}
      onClose={onClose}
      onConfirm={onConfirm}
      {...overrides}
    />
  );
  return { onClose, onConfirm, user };
}

describe('WalletAmountModal', () => {
  it('uses the shared dialog and focuses the amount field', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveAccessibleName('اشحن المحفظة');
    expect(screen.getByRole('spinbutton')).toHaveFocus();
  });

  it('submits a valid amount once', async () => {
    const { onConfirm, user } = renderModal();
    await user.type(screen.getByRole('spinbutton'), '25');
    await user.click(screen.getByRole('button', { name: 'شحن' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith(25);
  });

  it('disables submission above the maximum amount', async () => {
    const { onConfirm, user } = renderModal({ max: 50 });
    await user.type(screen.getByRole('spinbutton'), '51');
    expect(screen.getByRole('button', { name: 'شحن' })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('keeps the entered amount open when the action returns an error', async () => {
    const { user } = renderModal({
      onConfirm: vi.fn().mockResolvedValue(new AppError('conflict', 'wallet.topUpRejected')),
    });
    await user.type(screen.getByRole('spinbutton'), '25');
    const form = screen.getByRole('spinbutton').closest('form');
    if (!form) throw new Error('Amount form is missing');
    await user.click(within(form).getByRole('button'));
    await screen.findByRole('alert');
    expect(screen.getByRole('spinbutton')).toHaveValue(25);
  });

  it('keeps a busy form open', async () => {
    const { onClose, user } = renderModal({ loading: true });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
