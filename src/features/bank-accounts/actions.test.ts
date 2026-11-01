import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/lib/errors';
import type { BankAccount } from './model';

const { auth, getBankAccounts, getBanks, addBankAccount, updateBankAccount } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    getBankAccounts: vi.fn(),
    getBanks: vi.fn(),
    addBankAccount: vi.fn(),
    updateBankAccount: vi.fn(),
  })
);

vi.mock('@/auth', () => ({ auth }));
vi.mock('@/shared/lib/report', () => ({ reportError: vi.fn() }));
vi.mock('./api', () => ({
  bankAccountsApi: { getBankAccounts, getBanks, addBankAccount, updateBankAccount },
}));

import {
  addBankAccountAction,
  deleteBankAccountAction,
  getBankAccountsAction,
  getBanksAction,
  updateBankAccountAction,
} from './actions';

const validInput = { bankId: '2', iban: 'sa03 8000 0000 6080 1045 6789' };

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

describe('addBankAccountAction', () => {
  const account: BankAccount = {
    id: '18',
    bankId: '2',
    bankName: 'Bank Albilad',
    iban: 'SA0380000000608010456789',
    maskedNumber: '45 67 89',
  };

  it('sends the parsed values and returns the account with the backend message', async () => {
    addBankAccount.mockResolvedValue({
      ok: true,
      data: account,
      message: 'Bank account added successfully.',
    });

    await expect(addBankAccountAction(validInput)).resolves.toEqual({
      ok: true,
      data: account,
      message: 'Bank account added successfully.',
    });
    expect(addBankAccount).toHaveBeenCalledWith({
      bankId: '2',
      iban: 'SA0380000000608010456789',
    });
  });

  it('keeps a backend 422 message for the toast', async () => {
    addBankAccount.mockResolvedValue({
      ok: false,
      error: new AppError('validation', undefined, 422, undefined, {
        serverMessage: 'The selected bank does not exist.',
      }),
    });

    await expect(addBankAccountAction(validInput)).resolves.toEqual({
      ok: false,
      error: {
        kind: 'validation',
        status: 422,
        serverMessage: 'The selected bank does not exist.',
      },
    });
  });

  it('returns a 401 from the API as unauthorized', async () => {
    addBankAccount.mockResolvedValue({
      ok: false,
      error: new AppError('unauthorized', undefined, 401),
    });
    await expect(addBankAccountAction(validInput)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'unauthorized' },
    });
  });
});

describe('bank-account writes', () => {
  it('requires a session before it validates a bank account', async () => {
    auth.mockResolvedValue(null);
    await expect(addBankAccountAction({ bankId: '', iban: '' })).resolves.toEqual({
      ok: false,
      error: { kind: 'unauthorized' },
    });
  });

  it('rejects malformed input without calling the API', async () => {
    await expect(
      addBankAccountAction({ bankId: '', iban: 'GB82WEST12345698765432' })
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
    expect(addBankAccount).not.toHaveBeenCalled();
  });

  it('accepts a valid delete without the API until B6', async () => {
    await expect(deleteBankAccountAction('5')).resolves.toEqual({ ok: true, data: null });
  });

  it('rejects a delete ID that is not a positive integer as not found', async () => {
    for (const id of ['', 'abc', '0', '-1', '1.5', '5a', '99999999999999999999']) {
      await expect(deleteBankAccountAction(id)).resolves.toEqual({
        ok: false,
        error: { kind: 'not_found', code: 'bankAccounts.notFound' },
      });
    }
  });

  it('requires a session before an edit or delete', async () => {
    auth.mockResolvedValue(null);
    await expect(updateBankAccountAction('5', validInput)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'unauthorized' },
    });
    await expect(deleteBankAccountAction('5')).resolves.toMatchObject({
      ok: false,
      error: { kind: 'unauthorized' },
    });
  });
});

describe('updateBankAccountAction', () => {
  const account: BankAccount = {
    id: '5',
    bankId: '3',
    bankName: 'Riyad Bank',
    iban: 'SA0380000000608010456789',
    maskedNumber: '45 67 89',
  };

  it('sends the ID and the parsed values and returns the backend message', async () => {
    updateBankAccount.mockResolvedValue({
      ok: true,
      data: account,
      message: 'Bank account updated successfully.',
    });

    await expect(updateBankAccountAction('5', { ...validInput, bankId: '3' })).resolves.toEqual({
      ok: true,
      data: account,
      message: 'Bank account updated successfully.',
    });
    expect(updateBankAccount).toHaveBeenCalledWith('5', {
      bankId: '3',
      iban: 'SA0380000000608010456789',
    });
  });

  it('rejects malformed input without calling the API', async () => {
    await expect(
      updateBankAccountAction('5', { bankId: '3', iban: 'SA12' })
    ).resolves.toMatchObject({ ok: false, error: { kind: 'validation' } });
    expect(updateBankAccount).not.toHaveBeenCalled();
  });

  it('returns not found and a 422 message as plain error data', async () => {
    updateBankAccount.mockResolvedValueOnce({
      ok: false,
      error: new AppError('not_found', 'bankAccounts.notFound', 404),
    });
    await expect(updateBankAccountAction('99', validInput)).resolves.toEqual({
      ok: false,
      error: { kind: 'not_found', code: 'bankAccounts.notFound', status: 404 },
    });

    updateBankAccount.mockResolvedValueOnce({
      ok: false,
      error: new AppError('validation', undefined, 422, undefined, {
        serverMessage: 'The selected bank does not exist.',
      }),
    });
    await expect(updateBankAccountAction('5', validInput)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'validation', serverMessage: 'The selected bank does not exist.' },
    });
  });
});
