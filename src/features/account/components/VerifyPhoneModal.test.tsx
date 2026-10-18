import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/lib/errors';
import { renderWithIntl } from '@/shared/test/render';
import VerifyPhoneModal from './VerifyPhoneModal';

function renderModal(overrides: Partial<React.ComponentProps<typeof VerifyPhoneModal>> = {}) {
  const onVerifyCode = vi.fn<(code: string) => Promise<AppError | undefined>>(
    async () => undefined
  );
  const onResendCode = vi.fn<(phone: string) => Promise<AppError | undefined>>(
    async () => undefined
  );
  const user = userEvent.setup();
  renderWithIntl(
    <VerifyPhoneModal
      open
      onClose={vi.fn()}
      phone="966511111111"
      onVerifyCode={onVerifyCode}
      onResendCode={onResendCode}
      {...overrides}
    />
  );
  return {
    onVerifyCode: overrides.onVerifyCode ?? onVerifyCode,
    user,
    submit: screen.getByRole('button', { name: 'Verify' }),
  };
}

describe('VerifyPhoneModal', () => {
  it('enables verification only for a complete code and submits with the keyboard', async () => {
    const { onVerifyCode, user, submit } = renderModal();
    expect(submit).toBeDisabled();
    await user.keyboard('123');
    expect(submit).toBeDisabled();
    await user.keyboard('4{Enter}');
    await waitFor(() => expect(onVerifyCode).toHaveBeenCalledWith('1234'));
  });

  it('keeps a wrong code and ties the error to every digit', async () => {
    const onVerifyCode = vi.fn(
      async () =>
        new AppError('validation', 'account.invalidCode', undefined, {
          code: 'account.invalidCode',
        })
    );
    const { user, submit } = renderModal({ onVerifyCode });
    await user.keyboard('9999');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The verification code is incorrect. Try again.'
    );
    for (const digit of screen.getAllByRole('textbox')) {
      expect(digit).toHaveValue('9');
      expect(digit).toHaveAttribute('aria-invalid', 'true');
      expect(digit).toHaveAccessibleDescription('The verification code is incorrect. Try again.');
    }
  });

  it('shows the pending state on the submit button', async () => {
    const { submit } = renderModal({ loading: true });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
  });
});
