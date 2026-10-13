'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import JoinusForm from '@/components/join/JoinUsForm';
import { Button } from '@/shared/ui/Button';

export default function CTA() {
  const t = useTranslations('homeCta');
  const [joinUsOpen, setJoinUsOpen] = useState(false);

  return (
    <section className="cta">
      <div className="container-tcar">
        <div className="cta_content">
          <div className="cta_pattern" />

          <div className="cta_text">
            <h3>{t('title')}</h3>

            <p>{t('description')}</p>

            <Button
              type="button"
              size="lg"
              className="bg-white text-primary border-0"
              aria-haspopup="dialog"
              onClick={() => setJoinUsOpen(true)}
            >
              {t('cta')}
            </Button>
          </div>
        </div>
      </div>

      <JoinusForm open={joinUsOpen} onClose={() => setJoinUsOpen(false)} />
    </section>
  );
}
