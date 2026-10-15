import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Signed-in pages: keep them out of search results (robots.txt disallows them too).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
