'use client';

import * as RadixAccordion from '@radix-ui/react-accordion';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/lib/cn';
import './Accordion.scss';

/**
 * Disclosure list (FAQ, warranties). Radix supplies aria-expanded /
 * aria-controls, arrow-key movement between triggers, and height animation
 * through --radix-accordion-content-height.
 */
function Root({ className, ...props }: ComponentPropsWithoutRef<typeof RadixAccordion.Root>) {
  return <RadixAccordion.Root className={cn('accordion', className)} {...props} />;
}

function Item({ className, ...props }: ComponentPropsWithoutRef<typeof RadixAccordion.Item>) {
  return <RadixAccordion.Item className={cn('accordion__item', className)} {...props} />;
}

/** The trigger sits in a heading, as the WAI-ARIA accordion pattern expects. */
function Trigger({
  className,
  headingClassName,
  ...props
}: ComponentPropsWithoutRef<typeof RadixAccordion.Trigger> & { headingClassName?: string }) {
  return (
    <RadixAccordion.Header className={cn('accordion__header', headingClassName)}>
      <RadixAccordion.Trigger className={cn('accordion__trigger', className)} {...props} />
    </RadixAccordion.Header>
  );
}

function Content({ className, ...props }: ComponentPropsWithoutRef<typeof RadixAccordion.Content>) {
  return <RadixAccordion.Content className={cn('accordion__content', className)} {...props} />;
}

export const Accordion = { Root, Item, Trigger, Content };
