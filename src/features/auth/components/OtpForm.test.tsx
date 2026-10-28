import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/lib/errors';
import { renderWithIntl } from '@/shared/test/render';
import OtpForm from './OtpForm';

// BackButton reads the locale-aware router, which needs the app router; the forms pass onBack.
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }));

function renderForm(overrides: Partial<React.ComponentProps<typeof OtpForm>> = {}) {
  const onVerify = vi.fn<(code: string) => Promise<AppError | undefined>>(async () => undefined);
  const user = userEvent.setup();
  renderWithIntl(
    <OtpForm phone="966500000000" onBack={vi.fn()} onVerify={onVerify} {...overrides} />
  );
  const digits = () => screen.getAllByRole('textbox');
  const submit = screen.getByRole('button', { name: 'Verify and continue' });
  return { onVerify: overrides.onVerify ?? onVerify, user, digits, submit };
}

describe('OtpForm', () => {
  it('names the back button and edits the number from the description', async () => {
    const onBack = vi.fn();
    const onEditPhone = vi.fn();
    const { user } = renderForm({ onBack, onEditPhone });

    await user.click(screen.getByRole('button', { name: 'Edit number' }));
    expect(onEditPhone).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Back to mobile number' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows the resend countdown with two digits', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      renderForm();
      expect(screen.getByText('Resend the code in')).toBeInTheDocument();
      expect(screen.getByText(/00:30/)).toBeInTheDocument();
      for (let second = 0; second < 21; second += 1) act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText(/00:09/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('enables verification only for a complete code', async () => {
    const { user, submit } = renderForm();
    expect(submit).toBeDisabled();
    await user.keyboard('123');
    expect(submit).toBeDisabled();
    await user.keyboard('4');
    expect(submit).toBeEnabled();
  });

  it('submits the code with the keyboard', async () => {
    const { onVerify, user } = renderForm();
    await user.keyboard('1234{Enter}');
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith('1234'));
  });

  it('keeps a wrong code and ties the server error to every digit', async () => {
    const onVerify = vi.fn(
      async () =>
        new AppError('validation', 'auth.invalidCode', undefined, { code: 'auth.invalidCode' })
    );
    const { user, digits, submit } = renderForm({ onVerify });
    await user.keyboard('9999');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The verification code is incorrect. Try again.'
    );
    for (const digit of digits()) {
      expect(digit).toHaveValue('9');
      expect(digit).toHaveAttribute('aria-invalid', 'true');
      expect(digit).toHaveAccessibleDescription('The verification code is incorrect. Try again.');
    }
  });

  it('shows an error that belongs to no field as a form message', async () => {
    const onVerify = vi.fn(async () => new AppError('network'));
    const { user, submit } = renderForm({ onVerify });
    await user.keyboard('1234');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not connect. Check your internet connection and try again.'
    );
    expect(screen.getAllByRole('textbox')[0]).not.toHaveAttribute('aria-invalid');
  });

  it('cannot be submitted while pending', async () => {
    const { user, submit } = renderForm({ loading: true });
    await user.keyboard('1234');
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
  });
});
