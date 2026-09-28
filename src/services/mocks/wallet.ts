import type { Bank, BankAccount, WalletSummary, WalletTransaction } from '@app-types/car';
import sedadBankLogo from '@assets/images/banks/sedad-bank.png';

export const MOCK_WALLET_SUMMARY: WalletSummary = {
  total: 2500,
  withdrawable: 1500,
  nonWithdrawable: 1000,
};

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  { id: '1', type: 'topup', amount: 2500, reference: '7A3D6D', createdAt: '2025-12-01T04:50:00' },
  { id: '2', type: 'refund', amount: 2500, reference: '7A3D6E', createdAt: '2025-12-01T04:50:00' },
  { id: '3', type: 'payment', amount: 2500, reference: '7A3D6F', createdAt: '2025-12-01T04:50:00' },
  { id: '4', type: 'withdraw', amount: 2500, reference: '7A3D70', createdAt: '2025-12-01T04:50:00' },
];

export const MOCK_BANKS: Bank[] = [
  { id: 'sedad', name: 'بنك السداد', logo: sedadBankLogo },
  { id: 'alahli', name: 'البنك الأهلي' },
  { id: 'alrajhi', name: 'مصرف الراجحي' },
  { id: 'riyad', name: 'بنك الرياض' },
];

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: '1',
    bankId: 'sedad',
    bankName: 'بنك السداد',
    logo: sedadBankLogo,
    iban: 'SA0380000000608010456789',
    maskedNumber: '45 67 89',
  },
  {
    id: '2',
    bankId: 'alrajhi',
    bankName: 'مصرف الراجحي',
    iban: 'SA4420000001234567123456',
    maskedNumber: '12 34 56',
  },
  {
    id: '3',
    bankId: 'riyad',
    bankName: 'بنك الرياض',
    iban: 'SA1515000000000000987654',
    maskedNumber: '98 76 54',
  },
];
