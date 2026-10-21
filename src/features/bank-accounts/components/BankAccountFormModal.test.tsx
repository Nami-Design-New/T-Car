import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/lib/errors';
import { renderWithIntl } from '@/shared/test/render';
import type { Bank } from '../model';
import BankAccountFormModal from './BankAccountFormModal';

const banks: Bank[] = [{ id: 'alrajhi', name: 'Al Rajhi Bank' }];

function renderForm(
  overrides: Partial<React.ComponentProps<typeof BankAccountFormModal>> = {}
) {
  const onConfirm = vi.fn(async () => undefined);
  const user = userEvent.setup();
  renderWithIntl(
    <BankAccountFormModal
      open
      mode="add"
      banks={banks}
      onClose={vi.fn()}
      onConfirm={onConfirm}
      {...overrides}
    />
  );
  return {
    user,
    onConfirm: overrides.onConfirm ?? onConfirm,
    iban: screen.getByRole('textbox', { name: 'IBAN' }),
    submit: screen.getByRole('button', { name: 'Add' }),
  };
}

async function selectBank(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: 'Bank name' }));
  await user.click(screen.getByRole('button', { name: 'Al Rajhi Bank' }));
}

describe('BankAccountFormModal', () => {
  it('shows a Saudi IBAN error on blur and associates it with the input', async () => {
    const { user, iban } = renderForm();
    await user.type(iban, 'SA123');
    await user.tab();

    expect(await screen.findByText('Enter a valid Saudi IBAN.')).toBeInTheDocument();
    expect(iban).toHaveAttribute('aria-invalid', 'true');
    expect(iban).toHaveAccessibleDescription('Enter a valid Saudi IBAN.');
  });

  it('submits a normalized IBAN with the keyboard', async () => {
    const { user, onConfirm, iban } = renderForm();
    await selectBank(user);
    await user.type(iban, 'sa03 8000 0000 6080 1045 6789');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith({
        bankId: 'alrajhi',
        iban: 'SA0380000000608010456789',
      })
    );
  });

  it('keeps the IBAN and associates a server field error with it', async () => {
    const onConfirm = vi.fn(async () =>
      new AppError('validation', 'bankAccounts.invalidIban', undefined, {
        iban: 'bankAccounts.invalidIban',
      })
    );
    const { user, iban } = renderForm({ onConfirm });
    await selectBank(user);
    await user.type(iban, 'SA0380000000608010456789');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(iban).toHaveAccessibleDescription('Enter a valid Saudi IBAN.')
    );
    expect(iban).toHaveValue('SA0380000000608010456789');
  });

  it('makes the submit button busy while the action is pending', () => {
    const { submit } = renderForm({ loading: true });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
  });
});
