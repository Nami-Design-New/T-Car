import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/lib/errors';
import type { PhoneFieldValue } from '@/shared/lib/phone';
import { renderWithIntl } from '@/shared/test/render';
import LoginForm from './LoginForm';

// The country list comes from the stateless mock instead of the API.
vi.mock('@/features/phone-countries', async () => {
  const { phoneCountriesMock } = await import('@/features/phone-countries/api.mock');
  return { loadPhoneCountries: phoneCountriesMock.listCountries };
});

function renderForm(overrides: Partial<React.ComponentProps<typeof LoginForm>> = {}) {
  const onNext = vi.fn<(phone: PhoneFieldValue) => Promise<AppError | undefined>>(
    async () => undefined
  );
  const user = userEvent.setup();
  renderWithIntl(<LoginForm onNext={onNext} {...overrides} />);
  const phone = screen.getByRole('textbox', { name: 'Mobile number' });
  const submit = screen.getByRole('button', { name: 'Send code via WhatsApp' });
  return { onNext: overrides.onNext ?? onNext, user, phone, submit };
}

describe('LoginForm', () => {
  it('starts from the number it is given, e.g. after going back', () => {
    renderForm({ defaultPhone: { countryCode: '+962', phone: '791234567' } });
    expect(screen.getByRole('textbox', { name: 'Mobile number' })).toHaveValue('791234567');
  });

  it('shows the phone error on blur and ties it to the input', async () => {
    const { user, phone } = renderForm();
    await user.click(phone);
    await user.tab();

    const error = await screen.findByText('Enter a valid phone number.');
    expect(phone).toHaveAttribute('aria-invalid', 'true');
    expect(phone).toHaveAccessibleDescription('Enter a valid phone number.');
    expect(error).toHaveAttribute('role', 'alert');
  });

  it('does not submit an incomplete phone', async () => {
    const { onNext, user, submit } = renderForm();
    await user.click(submit);
    expect(await screen.findByText('Enter a valid phone number.')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('submits with the keyboard and clears the error while typing', async () => {
    const { onNext, user, phone } = renderForm();
    await user.click(phone);
    await user.keyboard('{Enter}');
    expect(await screen.findByText('Enter a valid phone number.')).toBeInTheDocument();

    await user.type(phone, '500000000');
    await waitFor(() =>
      expect(screen.queryByText('Enter a valid phone number.')).not.toBeInTheDocument()
    );
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({ countryCode: '+966', phone: '500000000' })
    );
  });

  it('keeps the phone and shows a server failure', async () => {
    const onNext = vi.fn(async () => new AppError('rate_limited'));
    const { user, phone, submit } = renderForm({ onNext });
    await user.type(phone, '500000000');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Wait a moment and try again.'
    );
    expect(phone).toHaveValue('500000000');
  });

  it('puts a server field error on the phone', async () => {
    const onNext = vi.fn(
      async () =>
        new AppError('validation', 'auth.invalidPhone', undefined, { phone: 'auth.invalidPhone' })
    );
    const { user, phone, submit } = renderForm({ onNext });
    await user.type(phone, '500000000');
    await user.click(submit);

    await waitFor(() => expect(phone).toHaveAttribute('aria-invalid', 'true'));
    expect(phone).toHaveAccessibleDescription('Enter a valid phone number.');
  });

  it('cannot be submitted while pending', () => {
    const { submit } = renderForm({ loading: true });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
  });
});
