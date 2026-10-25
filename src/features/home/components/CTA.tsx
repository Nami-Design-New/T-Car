'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/Button';
import JoinUsForm from './JoinUsForm';

export default function CTA() {
  const t = useTranslations('homeCta');
  const [joinUsOpen, setJoinUsOpen] = useState(false);

  return (
    <section className="cta mb-[70px]">
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <div className="cta_content relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--color-action-primary),#1a6bd4)] px-[30px] py-[60px] text-center max-md:px-5 max-md:py-[45px] before:absolute before:-start-0.5 before:top-[29%] before:z-[1] before:size-80 before:bg-[url('/images/brand/fav.svg')] before:bg-contain before:bg-center before:bg-no-repeat before:opacity-[0.09] before:brightness-0 before:invert before:content-['']">
          <div className="cta_pattern pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_20%_20%,white_2px,transparent_2px),radial-gradient(circle_at_80%_40%,white_2px,transparent_2px),radial-gradient(circle_at_40%_80%,white_2px,transparent_2px)] [background-size:80px_80px]" />

          <div className="cta_text relative z-[2] mx-auto max-w-[700px]">
            <h3 className="mb-3.5 text-[34px] font-bold text-text-on-action max-md:text-[26px]">{t('title')}</h3>

            <p className="mb-[30px] text-[17px] leading-[1.8] text-text-on-action/90 max-md:text-[15px]">{t('description')}</p>

            <Button
              type="button"
              size="lg"
              className="border-0 bg-white px-9 py-[15px] text-action-primary hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(30,30,30,0.15)]"
              aria-haspopup="dialog"
              onClick={() => setJoinUsOpen(true)}
            >
              {t('cta')}
            </Button>
          </div>
        </div>
      </div>

      <JoinUsForm open={joinUsOpen} onClose={() => setJoinUsOpen(false)} />
    </section>
  );
}
