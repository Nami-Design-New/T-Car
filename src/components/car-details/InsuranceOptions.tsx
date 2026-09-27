'use client';

import { useState } from 'react';
import { formatCurrency } from '@utils/index';
import type { InsuranceOption } from '@app-types/car';

interface Props {
  option: InsuranceOption;
}

export default function InsuranceOptions({ option }: Props) {
  const [activeTab, setActiveTab] = useState<'terms' | 'cancellation'>('terms');

  return (
    <section className="details-section">
      <h3>نوع التأمين</h3>

      <div className="insurance-list">
        <div className="insurance-item">
          <div className="insurance-item-body">
            <span className="insurance-item-title">{option.title}</span>
            <span className="insurance-item-subtitle">{option.subtitle}</span>
          </div>
        </div>
      </div>

      <div className="insurance-tabs">
        <button
          type="button"
          className={activeTab === 'terms' ? 'active' : ''}
          onClick={() => setActiveTab('terms')}
        >
          تعليمات المستأجر
        </button>
        <button
          type="button"
          className={activeTab === 'cancellation' ? 'active' : ''}
          onClick={() => setActiveTab('cancellation')}
        >
          سياسة الإلغاء
        </button>
      </div>

      <ul className="insurance-terms-list">
        {(activeTab === 'terms' ? option.terms : option.cancellationPolicy).map((term, i) => (
          <li key={i}>{term}</li>
        ))}
      </ul>
    </section>
  );
}
