'use client';

import { useEffect } from 'react';
import { reportError } from '@/shared/lib/report';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Last resort: an error in the [locale] layout itself. It replaces the whole
 * document, so the translations, fonts, and styles from the layout are not
 * available; the text is fixed and bilingual, and the styles are inline.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    reportError(error, { scope: 'global', digest: error.digest });
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#1e1e1e',
          background: '#ffffff',
        }}
      >
        {/* Small static car scene; inline colors, as no stylesheet loads here. */}
        <svg width="132" height="88" viewBox="0 0 132 88" fill="none" aria-hidden="true">
          <path d="M2 70 Q 66 58 130 70" stroke="#d6d6d6" strokeWidth="10" strokeLinecap="round" />
          <path d="M16 54 h74 a9 9 0 0 1 9 9 l1 5 h-84 a4 4 0 0 1 -4 -4 v-1 a9 9 0 0 1 4 -9 z" fill="#1f7ffa" />
          <path d="M30 54 l6 -16 h28 l8 16 z" fill="#1f7ffa" />
          <path d="M38 53 l4 -9 h17 l5 9 z" fill="#eaf3ff" />
          <circle cx="34" cy="70" r="8" fill="#1e1e1e" />
          <circle cx="34" cy="70" r="3" fill="#ccc" />
          <circle cx="82" cy="70" r="8" fill="#1e1e1e" />
          <circle cx="82" cy="70" r="3" fill="#ccc" />
          <path d="M104 30 l13 22 h-26 z" fill="#d97706" strokeLinejoin="round" />
          <rect x="100" y="38" width="4" height="8" rx="2" fill="#fff" />
          <circle cx="102" cy="49" r="2" fill="#fff" />
          <circle cx="58" cy="22" r="2.5" fill="#1f7ffa" />
          <circle cx="20" cy="30" r="2" fill="#d6d6d6" />
        </svg>
        <h1 style={{ margin: 0, fontSize: 24 }}>حدث خطأ غير متوقع</h1>
        <p lang="en" dir="ltr" style={{ margin: 0, color: '#737373' }}>
          Something went wrong.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 8,
            padding: '10px 24px',
            border: 0,
            borderRadius: 12,
            background: '#1f7ffa',
            color: '#ffffff',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          حاول مرة أخرى · Try again
        </button>
        {error.digest && (
          <p dir="ltr" style={{ margin: 0, fontSize: 12, color: '#969696' }}>
            Ref: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
