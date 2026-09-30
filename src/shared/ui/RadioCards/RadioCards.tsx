'use client';

import * as RadixRadioGroup from '@radix-ui/react-radio-group';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/lib/cn';
import './RadioCards.scss';

/**
 * A single choice shown as cards (payment method, pickup type, bank account).
 * Radix supplies the radiogroup / radio roles, arrow-key selection (RTL-aware
 * through DirectionProvider), and one tab stop for the whole group.
 * Give the Root an accessible name with aria-label or aria-labelledby.
 */
function Root({ className, ...props }: ComponentPropsWithoutRef<typeof RadixRadioGroup.Root>) {
  return <RadixRadioGroup.Root className={cn('radio-cards', className)} {...props} />;
}

/** One card; it is the radio itself, so put the card's whole content inside. */
function Item({ className, ...props }: ComponentPropsWithoutRef<typeof RadixRadioGroup.Item>) {
  return <RadixRadioGroup.Item className={cn('radio-card', className)} {...props} />;
}

export const RadioCards = { Root, Item };
