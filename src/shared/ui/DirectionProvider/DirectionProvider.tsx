'use client';

import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction';
import type { ReactNode } from 'react';

export interface DirectionProviderProps {
  dir: 'ltr' | 'rtl';
  children: ReactNode;
}

/** Tells every Radix primitive the page direction, so RTL keyboard and layout match. */
export function DirectionProvider({ dir, children }: DirectionProviderProps) {
  return <RadixDirectionProvider dir={dir}>{children}</RadixDirectionProvider>;
}
