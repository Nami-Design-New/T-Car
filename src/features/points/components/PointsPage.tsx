'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { Link } from '@/i18n/navigation';
import { POINTS_ICONS } from '@/shared/config/assets';
import type { PointsData, PointsFilter, PointsTransaction } from '../model';

interface Props {
  data: PointsData;
}

const FILTERS: PointsFilter[] = ['all', 'earned', 'spent'];

export default function PointsPage({ data }: Props) {
  const t = useTranslations('account.points');
  const locale = useLocale();
  const [filter, setFilter] = useState<PointsFilter>('all');
  const transactions = data.transactions.filter(
    (transaction) => filter === 'all' || transaction.type === filter
  );

  return (
    <section className="points-page">
      <header className="points-page__header">
        <h1>{t('historyTitle')}</h1>
      </header>

      <div className="points-page__summary">
        <h2>
          {data.summary.balance} <span>{t('unit')}</span>
        </h2>
        <p>{t('expiresAt', { date: formatDate(data.summary.expiresAt, locale) })}</p>
      </div>

      <div className="points-page__filters" role="tablist" aria-label={t('filtersLabel')}>
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            className={filter === item ? 'is-active' : ''}
            onClick={() => setFilter(item)}
          >
            {t(`filters.${item}`)}
          </button>
        ))}
      </div>

      <ul className="points-page__transactions">
        {transactions.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} locale={locale} t={t} />
        ))}
      </ul>
    </section>
  );
}

function TransactionRow({
  transaction,
  locale,
  t,
}: {
  transaction: PointsTransaction;
  locale: string;
  t: ReturnType<typeof useTranslations<'account.points'>>;
}) {
  const icon = POINTS_ICONS[transaction.type];

  return (
    <li className={`points-transaction points-transaction--${transaction.type}`}>
      <div className="points-transaction__content">
        <strong>{t(`transaction.${transaction.type}`)}</strong>
        <span>{formatDate(transaction.createdAt, locale)}</span>
      </div>
      <span className="points-transaction__icon">
        <Image src={icon.src} alt="" width={icon.width} height={icon.height} />
      </span>
      <span className="points-transaction__amount" dir="ltr">
        {transaction.amount > 0 ? '+' : ''}
        {transaction.amount}
      </span>
    </li>
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(new Date(value));
}
