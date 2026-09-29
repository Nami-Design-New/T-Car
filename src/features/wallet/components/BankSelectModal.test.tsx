import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/shared/test/render';
import BankSelectModal from './BankSelectModal';

const account = {
  id: 'bank-1',
  bankId: 'al-rajhi',
  bankName: 'Al Rajhi',
  maskedNumber: '**** 1234',
  iban: 'SA001',
};

describe('BankSelectModal', () => {
  it('uses the shared dialog and selects an account', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<BankSelectModal open accounts={[account]} onClose={vi.fn()} onSelect={onSelect} />);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('اختر البنك');
    await user.click(screen.getByRole('button', { name: /Al Rajhi/ }));
    expect(onSelect).toHaveBeenCalledWith(account);
  });

  it('shows an empty state and closes through Dialog', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<BankSelectModal open accounts={[]} onClose={onClose} onSelect={vi.fn()} />);
    expect(screen.getByText('لا توجد حسابات بنكية مضافة')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
