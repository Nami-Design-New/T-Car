'use client';

import { useState } from 'react';
import { formatCurrency } from '@utils/index';
import type { InsuranceOption } from '@app-types/car';

interface Props {
  options: InsuranceOption[];
  onSelect?: (option: InsuranceOption) => void;
}

export default function InsuranceOptions({ options, onSelect }: Props) {
  const [selectedId, setSelectedId] = useState(options[0]?.id);
  const [activeTab, setActiveTab] = useState<'terms' | 'cancellation'>('terms');

  const selected = options.find((o) => o.id === selectedId) ?? options[0];

  const handleSelect = (option: InsuranceOption) => {
    setSelectedId(option.id);
    onSelect?.(option);
  };

  return (
    <section className="details-section">
      <h3>نوع التأمين</h3>

      <div className="insurance-list">
        {options.map((option) => (
          <label key={option.id} className={`insurance-item ${selectedId === option.id ? 'selected' : ''}`}>
            <input
              type="radio"
              name="insurance"
              checked={selectedId === option.id}
              onChange={() => handleSelect(option)}
            />
            <div className="insurance-item-body">
              <span className="insurance-item-title">{option.title}</span>
              <span className="insurance-item-subtitle">{option.subtitle}</span>
            </div>
            <span className="insurance-item-price">
              {formatCurrency(option.pricePerDay)}
              <small>/ يوم</small>
            </span>
          </label>
        ))}
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
        {(activeTab === 'terms' ? selected?.terms : selected?.cancellationPolicy)?.map((term, i) => (
          <li key={i}>{term}</li>
        ))}
      </ul>
    </section>
  );
}