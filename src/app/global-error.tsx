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
