'use client';

import Image from 'next/image';
import Lottie from 'lottie-react';
import { FiLock } from 'react-icons/fi';
import { formatAmount, formatTransactionDate } from '@/shared/lib/format';
import type { WalletSummary, WalletTransaction } from '../model';
import Loader from '@/shared/ui/Loader';

import walletIcon from '@assets/icons/money.svg';
import coinIcon from '@assets/icons/coin.svg';
import balanceIcon from '@assets/icons/balance.svg';
import sarIcon from '@assets/icons/sar.svg';
import emptyAnimation from '@assets/images/non_data.json';

interface Props {
  summary: WalletSummary;
  transactions: WalletTransaction[];
  loading?: boolean;
  onTopUp: () => void;
  onWithdraw: () => void;
}

const TYPE_LABELS: Record<WalletTransaction['type'], string> = {
  topup: 'شحن',
  refund: 'استرداد',
  payment: 'دفع',
  withdraw: 'سحب',
};

function Amount({ value, size }: { value: number; size: number }) {
  return (
    <span className="wallet_amount">
      <span>{formatAmount(value)}</span>
      <Image src={sarIcon} alt="ريال" width={size} height={size} className="currency_icon" />
    </span>
  );
}

export default function WalletTab({
  summary,
  transactions,
  loading = false,
  onTopUp,
  onWithdraw,
}: Props) {
  if (loading) {
    return (
      <div className="account-panel">
        <Loader fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="account-panel">
      <div className="wallet_balance_card">
        <div className="wallet_balance_label">
          <Image src={walletIcon} alt="" width={22} height={22} />
          <span>اجمالي الرصيد</span>
        </div>

        <div className="wallet_balance_amount">
          <Amount value={summary.total} size={30} />
        </div>

        <div className="wallet_balance_actions">
          <button type="button" className="wallet_action_btn primary" onClick={onTopUp}>
            إضافة رصيد
          </button>
          <button
            type="button"
            className="wallet_action_btn outline"
            onClick={onWithdraw}
            disabled={summary.withdrawable <= 0}
          >
            اسحب رصيد
          </button>
        </div>

        <div className="wallet_balance_breakdown">
          <div className="wallet_breakdown_item">
            <span className="wallet_breakdown_label">
              <Image src={coinIcon} alt="" width={18} height={18} />
              رصيد قابل للسحب
            </span>
            <Amount value={summary.withdrawable} size={16} />
          </div>

          <div className="wallet_breakdown_item">
            <span className="wallet_breakdown_label">
              <Image src={balanceIcon} alt="" width={18} height={18} />
              رصيد غير قابل للسحب
            </span>
            <Amount value={summary.nonWithdrawable} size={16} />
          </div>
        </div>
      </div>

      <div className="wallet_history">
        <h3 className="wallet_history_title">سجل الرصيد</h3>

        {transactions.length === 0 ? (
          <div className="wallet_history_empty">
            <Lottie
              animationData={emptyAnimation}
              loop
              className="wallet_history_empty_animation"
            />
            <p>لا توجد عمليات على المحفظة بعد</p>
          </div>
        ) : (
          <ul className="wallet_history_list">
            {transactions.map((tx) => (
              <li key={tx.id} className={`wallet_history_item ${tx.type}`}>
                <div className="wallet_history_item_body">
                  <span className="wallet_history_item_title">{TYPE_LABELS[tx.type]}</span>
                  <span className="wallet_history_item_meta">
                    {formatTransactionDate(tx.createdAt)}
                  </span>
                </div>

                <div className="wallet_history_item_side">
                  <span className="wallet_history_item_amount">
                    <Amount value={tx.amount} size={14} />
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
