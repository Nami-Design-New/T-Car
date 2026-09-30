'use client';

import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/lib/cn';
import './Menu.scss';

/**
 * A dropdown of actions (user menu, booking actions, language). Radix supplies
 * the menu roles, arrow keys and typeahead, Escape and outside-click to close,
 * focus return to the trigger, and collision-aware positioning in a portal.
 */
const Root = RadixMenu.Root;

/** Usually `asChild` around the existing trigger button. */
const Trigger = RadixMenu.Trigger;

function Content({
  className,
  sideOffset = 6,
  align = 'end',
  ...props
}: ComponentPropsWithoutRef<typeof RadixMenu.Content>) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        className={cn('menu', className)}
        sideOffset={sideOffset}
        align={align}
        {...props}
      />
    </RadixMenu.Portal>
  );
}

function Item({
  className,
  tone = 'default',
  ...props
}: ComponentPropsWithoutRef<typeof RadixMenu.Item> & { tone?: 'default' | 'danger' }) {
  return (
    <RadixMenu.Item className={cn('menu__item', tone === 'danger' && 'menu__item--danger', className)} {...props} />
  );
}

function Separator({ className, ...props }: ComponentPropsWithoutRef<typeof RadixMenu.Separator>) {
  return <RadixMenu.Separator className={cn('menu__separator', className)} {...props} />;
}

export const Menu = { Root, Trigger, Content, Item, Separator };
