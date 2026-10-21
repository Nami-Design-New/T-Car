import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BankAccount } from './model';

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock('@/auth', () => ({ auth }));
vi.mock('@/shared/lib/report', () => ({ reportError: vi.fn() }));

import { addBankAccountAction, updateBankAccountAction } from './actions';

const current: BankAccount[] = [];
const validInput = { bankId: 'alrajhi', iban: 'sa03 8000 0000 6080 1045 6789' };

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: 'user-1' } });
});

describe('bank-account actions', () => {
  it('requires a session before it validates a bank account', async () => {
    auth.mockResolvedValue(null);
    await expect(addBankAccountAction({ bankId: '', iban: '' }, current)).resolves.toEqual({
      ok: false,
      error: { kind: 'unauthorized' },
    });
  });

  it('rejects malformed input before changing the accounts', async () => {
    await expect(
      addBankAccountAction({ bankId: '', iban: 'GB82WEST12345698765432' }, current)
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'validation',
        code: 'bankAccounts.unknownBank',
        fieldErrors: {
          bankId: 'bankAccounts.unknownBank',
          iban: 'bankAccounts.invalidIban',
        },
      },
    });
  });

  it('uses the normalized IBAN after a successful add', async () => {
    await expect(addBankAccountAction(validInput, current)).resolves.toMatchObject({
      ok: true,
      data: [
        {
          bankId: 'alrajhi',
          iban: 'SA0380000000608010456789',
          maskedNumber: '45 67 89',
        },
      ],
    });
  });

  it('keeps an unknown bank as an action-level availability check', async () => {
    await expect(
      updateBankAccountAction('account-1', { ...validInput, bankId: 'unknown' }, [
        { id: 'account-1', bankId: 'alrajhi', bankName: 'Al Rajhi', iban: validInput.iban, maskedNumber: '45 67 89' },
      ])
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'validation',
        code: 'bankAccounts.unknownBank',
        fieldErrors: { bankId: 'bankAccounts.unknownBank' },
      },
    });
  });
});
