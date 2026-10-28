"use client";

import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * A dropdown of actions (user menu, booking actions, language). Radix supplies
 * the menu roles, arrow keys and typeahead, Escape and outside-click to close,
 * focus return to the trigger, and collision-aware positioning in a portal.
 */
const Root = RadixMenu.Root;

/** Usually `asChild` around the existing trigger button. */
const Trigger = RadixMenu.Trigger;

const menuContentClasses =
  "menu z-[1060] min-w-[200px] rounded-md border border-stroke-light bg-surface-elevated p-1.5 shadow-[0_10px_30px_rgba(30,30,30,0.1)] animate-[menu-in_0.12s_ease-out] motion-reduce:animate-none";

const menuItemClasses =
  "menu__item flex w-full select-none items-center gap-2.5 rounded-sm border-0 bg-transparent px-3 py-2.5 text-sm font-semibold no-underline outline-none [&_img]:shrink-0 [&_img]:object-contain [&_svg]:shrink-0 [&_svg]:object-contain data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

const menuSeparatorClasses = "menu__separator mx-1 my-1.5 h-px bg-stroke-light";

function Content({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: ComponentPropsWithoutRef<typeof RadixMenu.Content>) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        className={cn(menuContentClasses, className)}
        sideOffset={sideOffset}
        align={align}
        {...props}
      />
    </RadixMenu.Portal>
  );
}

function Item({
  className,
  tone = "default",
  ...props
}: ComponentPropsWithoutRef<typeof RadixMenu.Item> & {
  tone?: "default" | "danger";
}) {
  return (
    <RadixMenu.Item
      className={cn(
        menuItemClasses,
        tone === "danger"
          ? "text-status-error data-highlighted:bg-status-error-background data-highlighted:text-status-error cursor-pointer"
          : "text-text-primary data-highlighted:bg-surface-card-primary data-highlighted:text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

function Separator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixMenu.Separator>) {
  return (
    <RadixMenu.Separator
      className={cn(menuSeparatorClasses, className)}
      {...props}
    />
  );
}

export const Menu = { Root, Trigger, Content, Item, Separator };
