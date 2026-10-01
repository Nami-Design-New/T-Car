'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FiLock } from 'react-icons/fi';
import { formatTransactionDate } from '@/shared/lib/format';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Price } from '@/shared/ui/Price';
import type { WalletSummary, WalletTransaction } from '../model';
import Loader from '@/shared/ui/Loader';

import { ICONS } from '@/shared/config/assets';
const walletIcon = ICONS.money;
const coinIcon = ICONS.coin;
const balanceIcon = ICONS.balance;

interface Props {
  summary: WalletSummary;
  transactions: WalletTransaction[];
  loading?: boolean;
  /** Set when the wallet failed to load; ErrorState picks the message. */
  error?: unknown;
  onRetry?: () => void;
  onTopUp: () => void;
  onWithdraw: () => void;
}

export default function WalletTab({
  summary,
  transactions,
  loading = false,
  error,
  onRetry,
  onTopUp,
  onWithdraw,
}: Props) {
  const t = useTranslations('wallet');
  if (loading) {
    return (
      <div className="account-panel">
        <Loader fullScreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-panel">
        <ErrorState error={error} onRetry={onRetry} size="section" />
      </div>
    );
  }

  return (
    <div className="account-panel">
      <div className="wallet_balance_card">
        <div className="wallet_balance_label">
          <Image src={walletIcon} alt="" width={22} height={22} />
          <span>{t('totalBalance')}</span>
        </div>

        <div className="wallet_balance_amount">
          <Price amount={summary.total} size="xl" className="wallet_amount" />
        </div>

        <div className="wallet_balance_actions">
          <button type="button" className="wallet_action_btn primary" onClick={onTopUp}>
            {t('addBalance')}
          </button>
          <button
            type="button"
            className="wallet_action_btn outline"
            onClick={onWithdraw}
            disabled={summary.withdrawable <= 0}
          >
            {t('withdrawBalance')}
          </button>
        </div>

        <div className="wallet_balance_breakdown">
          <div className="wallet_breakdown_item">
            <span className="wallet_breakdown_label">
              <Image src={coinIcon} alt="" width={18} height={18} />
              {t('withdrawableBalance')}
            </span>
            <Price amount={summary.withdrawable} size="md" className="wallet_amount" />
          </div>

          <div className="wallet_breakdown_item">
            <span className="wallet_breakdown_label">
              <Image src={balanceIcon} alt="" width={18} height={18} />
              {t('nonWithdrawableBalance')}
            </span>
            <Price amount={summary.nonWithdrawable} size="md" className="wallet_amount" />
          </div>
        </div>
      </div>

      <div className="wallet_history">
        <h3 className="wallet_history_title">{t('history')}</h3>

        {transactions.length === 0 ? (
          <EmptyState title={t('empty.history')} size="section" />
        ) : (
          <ul className="wallet_history_list">
            {transactions.map((tx) => (
              <li key={tx.id} className={`wallet_history_item ${tx.type}`}>
                <div className="wallet_history_item_body">
                  <span className="wallet_history_item_title">{t(`transaction.${tx.type}`)}</span>
                  <span className="wallet_history_item_meta">
                    {formatTransactionDate(tx.createdAt)}
                  </span>
                </div>

                <div className="wallet_history_item_side">
                  <span className="wallet_history_item_amount">
                    <Price amount={tx.amount} size="sm" className="wallet_amount" />
                  </span>
                  <span className="wallet_history_item_meta">#{tx.reference}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
