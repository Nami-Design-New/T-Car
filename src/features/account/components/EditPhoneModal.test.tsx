import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/lib/errors';
import { renderWithIntl } from '@/shared/test/render';
import EditPhoneModal from './EditPhoneModal';

// The country list comes from the stateless mock instead of the API.
vi.mock('@/features/phone-countries', async () => {
  const { phoneCountriesMock } = await import('@/features/phone-countries/api.mock');
  return { loadPhoneCountries: phoneCountriesMock.listCountries };
});

function renderModal(overrides: Partial<React.ComponentProps<typeof EditPhoneModal>> = {}) {
  const onSendCode = vi.fn<(phone: string) => Promise<AppError | undefined>>(
    async () => undefined
  );
  const user = userEvent.setup();
  renderWithIntl(
    <EditPhoneModal
      open
      onClose={vi.fn()}
      currentPhone="966500000000"
      onSendCode={onSendCode}
      {...overrides}
    />
  );
  return {
    onSendCode: overrides.onSendCode ?? onSendCode,
    user,
    phone: screen.getByRole('textbox', { name: 'Mobile number' }),
    submit: screen.getByRole('button', { name: 'Send verification code' }),
  };
}

describe('EditPhoneModal', () => {
  it('starts from the current number and sends it with the keyboard', async () => {
    const { onSendCode, user, phone } = renderModal();
    expect(phone).toHaveValue('+966 500 000 000');
    await user.click(phone);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onSendCode).toHaveBeenCalledWith('966500000000'));
  });

  it('shows an incomplete number on the field and does not send it', async () => {
    const { onSendCode, user, phone, submit } = renderModal({ currentPhone: '966' });
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid phone number.');
    expect(phone).toHaveAttribute('aria-invalid', 'true');
    expect(phone).toHaveAccessibleDescription('Enter a valid phone number.');
    expect(onSendCode).not.toHaveBeenCalled();
  });

  it('keeps the number and shows a rate limit as a form message', async () => {
    const onSendCode = vi.fn(async () => new AppError('rate_limited', 'account.resendLimited'));
    const { user, phone, submit } = renderModal({ onSendCode });
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The code cannot be resent yet. Wait a moment and try again.'
    );
    expect(phone).toHaveValue('+966 500 000 000');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows the pending state on the submit button', () => {
    const { submit } = renderModal({ loading: true });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
  });
});
