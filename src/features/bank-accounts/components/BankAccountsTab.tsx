'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { PiBank } from 'react-icons/pi';
import type { BankAccount } from '../model';
import Loader from '@/shared/ui/Loader';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';

import { ICONS } from '@/shared/config/assets';
const deleteIcon = ICONS.bankDelete;
const editIcon = ICONS.bankEdit;

interface Props {
  accounts: BankAccount[];
  loading?: boolean;
  /** Set when the accounts failed to load; ErrorState picks the message. */
  error?: unknown;
  onRetry?: () => void;
  onAdd: () => void;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
}

export default function BankAccountsTab({
  accounts,
  loading = false,
  error,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations('bankAccounts');
  if (loading) {
    return (
      <div className="account-panel">
        <Loader fullScreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-panel bank_accounts_panel">
        <h3 className="bank_accounts_title">{t('title')}</h3>
        <ErrorState error={error} onRetry={onRetry} size="section" />
      </div>
    );
  }

  return (
    <div className="account-panel bank_accounts_panel">
      <h3 className="bank_accounts_title">{t('title')}</h3>

      {accounts.length === 0 ? (
        <EmptyState title={t('title')} size="section" />
      ) : (
        <ul className="bank_accounts_list">
          {accounts.map((account) => (
            <li key={account.id} className="bank_account_card">
              <div className="bank_account_info">
                <div className="bank_account_bank">
                  {account.logo ? (
                    <Image
                      src={account.logo}
                      alt=""
                      width={45}
                      height={20}
                      className="bank_account_logo"
                    />
                  ) : (
                    <PiBank className="bank_account_logo_fallback" aria-hidden="true" />
                  )}
                  <span>{account.bankName}</span>
                </div>
                <span className="bank_account_number" dir="ltr">
                  {account.maskedNumber}
                </span>
              </div>

              <div className="bank_account_actions">
                <button
                  type="button"
                  className="bank_account_action"
                  onClick={() => onEdit(account)}
                  aria-label={t('edit', { bank: account.bankName })}
                >
                  <Image src={editIcon} alt="" width={20} height={20} />
                </button>
                <button
                  type="button"
                  className="bank_account_action"
                  onClick={() => onDelete(account)}
                  aria-label={t('delete', { bank: account.bankName })}
                >
                  <Image src={deleteIcon} alt="" width={20} height={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="bank_accounts_add wallet_topup_submit btn w-100"
        onClick={onAdd}
      >
        {t('add')}
      </button>
    </div>
  );
}
