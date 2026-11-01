import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/lib/errors';
import type { BankAccount } from './model';

const { auth, getBankAccounts, getBanks } = vi.hoisted(() => ({
  auth: vi.fn(),
  getBankAccounts: vi.fn(),
  getBanks: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth }));
vi.mock('@/shared/lib/report', () => ({ reportError: vi.fn() }));
vi.mock('./api', () => ({ bankAccountsApi: { getBankAccounts, getBanks } }));

import {
  addBankAccountAction,
  getBankAccountsAction,
  getBanksAction,
  updateBankAccountAction,
} from './actions';

const current: BankAccount[] = [];
const validInput = { bankId: 'alrajhi', iban: 'sa03 8000 0000 6080 1045 6789' };

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: 'user-1' } });
});

describe('getBankAccountsAction', () => {
  it('requires a session before reading', async () => {
    auth.mockResolvedValue(null);
    await expect(getBankAccountsAction(1)).resolves.toEqual({
      ok: false,
      error: { kind: 'unauthorized' },
    });
    expect(getBankAccounts).not.toHaveBeenCalled();
  });

  it('rejects a page that is not a positive integer', async () => {
    for (const page of [0, -1, 1.5, Number.NaN]) {
      await expect(getBankAccountsAction(page)).resolves.toMatchObject({
        ok: false,
        error: { kind: 'validation' },
      });
    }
    expect(getBankAccounts).not.toHaveBeenCalled();
  });

  it('returns the requested page of API accounts', async () => {
    const accounts: BankAccount[] = [
      { id: '5', bankId: '2', bankName: 'Al Rajhi', iban: 'SA44', maskedNumber: '12 34 56' },
    ];
    const page = { items: accounts, page: 2, lastPage: 2, total: 11 };
    getBankAccounts.mockResolvedValue(page);
    await expect(getBankAccountsAction(2)).resolves.toEqual({ ok: true, data: page });
    expect(getBankAccounts).toHaveBeenCalledWith(2);
  });

  it('returns a read failure as plain error data', async () => {
    getBankAccounts.mockRejectedValue(new AppError('network'));
    await expect(getBankAccountsAction(1)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'network' },
    });
  });
});

describe('getBanksAction', () => {
  const page = { items: [{ id: '2', name: 'Bank Albilad' }], page: 1, lastPage: 1, total: 1 };

  it('reads the public lookup without a session', async () => {
    auth.mockResolvedValue(null);
    getBanks.mockResolvedValue(page);
    await expect(getBanksAction(1)).resolves.toEqual({ ok: true, data: page });
    expect(getBanks).toHaveBeenCalledWith({ page: 1, search: undefined });
  });

  it('rejects a page that is not a positive integer', async () => {
    for (const value of [0, -1, 1.5, Number.NaN]) {
      await expect(getBanksAction(value)).resolves.toMatchObject({
        ok: false,
        error: { kind: 'validation' },
      });
    }
    expect(getBanks).not.toHaveBeenCalled();
  });

  it('trims the search term and drops an empty one', async () => {
    getBanks.mockResolvedValue(page);
    await getBanksAction(1, '  bilad ');
    expect(getBanks).toHaveBeenLastCalledWith({ page: 1, search: 'bilad' });
    await getBanksAction(1, '   ');
    expect(getBanks).toHaveBeenLastCalledWith({ page: 1, search: undefined });
  });

  it('caps the search term length', async () => {
    getBanks.mockResolvedValue(page);
    await getBanksAction(1, 'a'.repeat(150));
    expect(getBanks).toHaveBeenLastCalledWith({ page: 1, search: 'a'.repeat(100) });
  });

  it('rejects a search term that is not a string', async () => {
    await expect(getBanksAction(1, 5 as unknown as string)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'validation' },
    });
    expect(getBanks).not.toHaveBeenCalled();
  });

  it('returns a read failure as plain error data', async () => {
    getBanks.mockRejectedValue(new AppError('server'));
    await expect(getBanksAction(1)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'server' },
    });
  });
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
