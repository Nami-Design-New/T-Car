'use client';

import { useState } from 'react';
import { formatCurrency } from '@/shared/lib/format';
import { Tabs } from '@/shared/ui/Tabs';
import type { InsuranceOption } from '../model';

interface Props {
  option: InsuranceOption;
}

type InsuranceTab = 'terms' | 'cancellation';

export default function InsuranceOptions({ option }: Props) {
  const [activeTab, setActiveTab] = useState<InsuranceTab>('terms');

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

      <Tabs.Root
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as InsuranceTab)}
      >
        <Tabs.List className="insurance-tabs" aria-label="تفاصيل التأمين">
          <Tabs.Trigger value="terms" className={activeTab === 'terms' ? 'active' : ''}>
            تعليمات المستأجر
          </Tabs.Trigger>
          <Tabs.Trigger
            value="cancellation"
            className={activeTab === 'cancellation' ? 'active' : ''}
          >
            سياسة الإلغاء
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="terms">
          <ul className="insurance-terms-list">
            {option.terms.map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ul>
        </Tabs.Content>
        <Tabs.Content value="cancellation">
          <ul className="insurance-terms-list">
            {option.cancellationPolicy.map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ul>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
