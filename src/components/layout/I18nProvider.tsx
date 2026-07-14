'use client';

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '@lib/i18n';
import { isRTL } from '@utils/index';

function DirectionManager() {
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    const lang = i18nInstance.language || 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
  }, [i18nInstance.language]);

  return null;
}

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <DirectionManager />
      {children}
    </I18nextProvider>
  );
}
