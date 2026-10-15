'use client';

import * as RadixTabs from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Tabs for content that is already loaded and not worth a URL (doc 5 A.1),
 * e.g. insurance terms / cancellation. Radix supplies the tab roles, arrow
 * keys (RTL-aware through DirectionProvider), and focus management.
 */
function Root({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.Root>) {
  return <RadixTabs.Root className={cn('tabs', className)} {...props} />;
}

function List({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn('tabs__list', className)} {...props} />;
}

function Trigger({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return <RadixTabs.Trigger className={cn('tabs__trigger', className)} {...props} />;
}

function Content({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn('tabs__content', className)} {...props} />;
}

export const Tabs = { Root, List, Trigger, Content };
