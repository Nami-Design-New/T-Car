"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { useRef, type ReactNode } from "react";
import { FiX } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

// Logical sides: `end` is the right edge in LTR and the left edge in RTL.
const drawerSideClasses = {
  end: "end-0 shadow-[-18px_0_48px_rgba(30,30,30,0.2)] animate-[drawer-slide-in-right_0.28s_cubic-bezier(0.22,1,0.36,1)] rtl:shadow-[18px_0_48px_rgba(30,30,30,0.2)] rtl:animate-[drawer-slide-in-left_0.28s_cubic-bezier(0.22,1,0.36,1)]",
  start:
    "start-0 shadow-[18px_0_48px_rgba(30,30,30,0.2)] animate-[drawer-slide-in-left_0.28s_cubic-bezier(0.22,1,0.36,1)] rtl:shadow-[-18px_0_48px_rgba(30,30,30,0.2)] rtl:animate-[drawer-slide-in-right_0.28s_cubic-bezier(0.22,1,0.36,1)]",
};

export interface DrawerProps {
  open: boolean;
  /** The one close request: Escape, backdrop, or a Drawer.Close. */
  onClose: () => void;
  children: ReactNode;
  /** Edge the panel docks to; follows the reading direction. */
  side?: "end" | "start";
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  /** Accessible name when the drawer has no visible Drawer.Title. */
  label?: string;
  /** Styling hook on the panel (not the backdrop). */
  className?: string;
}

/**
 * A full-height side panel. Same Radix base as Dialog: portal, focus trap and
 * restore, scroll lock, stacking, and dismissal; callers only compose content.
 */
function DrawerRoot({
  open,
  onClose,
  children,
  side = "end",
  closeOnEscape = true,
  closeOnBackdrop = true,
  label,
  className,
}: DrawerProps) {
  const openerRef = useRef<HTMLElement | null>(null);

  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="drawer-backdrop fixed inset-0 z-10000 bg-black/42 backdrop-blur-xs animate-[dialog-fade-in_0.24s_ease-out] motion-reduce:animate-none" />
        <RadixDialog.Content
          aria-modal="true"
          aria-label={label}
          aria-describedby={undefined}
          className={cn(
            "drawer",
            `drawer--${side}`,
            "fixed bottom-0 top-0 z-10001 flex w-[min(440px,100vw)] flex-col bg-surface-elevated text-text-primary outline-none motion-reduce:animate-none",
            drawerSideClasses[side],
            className,
          )}
          onEscapeKeyDown={(event) => {
            if (!closeOnEscape) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!closeOnBackdrop) event.preventDefault();
          }}
          onOpenAutoFocus={() => {
            // Runs before Radix moves focus in, so this is still the opener.
            openerRef.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(event) => {
            // Controlled by `open`, not a Radix Trigger: restore focus ourselves.
            event.preventDefault();
            openerRef.current?.focus();
          }}
        >
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

interface PartProps {
  children: ReactNode;
  className?: string;
}

function Header({ children, className }: PartProps) {
  return (
    <header
      className={cn(
        "drawer__header flex items-center justify-between gap-4 border-b border-stroke-light px-6 pb-5 pt-8",
        className,
      )}
    >
      {children}
    </header>
  );
}

function Title({ children, className }: PartProps) {
  return (
    <RadixDialog.Title
      className={cn("drawer__title m-0 text-xl font-semibold", className)}
    >
      {children}
    </RadixDialog.Title>
  );
}

/** The only part that scrolls, so the header stays reachable. */
function Body({ children, className }: PartProps) {
  return (
    <div
      className={cn(
        "drawer__body min-h-0 flex-1 overflow-y-auto px-6 py-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CloseProps {
  /** Accessible name; defaults to the localized "Close". */
  label?: string;
  className?: string;
}

/** Icon close button. */
function Close({ label, className }: CloseProps) {
  const t = useTranslations("states.dialog");
  return (
    <RadixDialog.Close
      className={cn(
        "drawer__close grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-full border border-stroke-light bg-surface-on-background text-[19px] text-text-primary transition hover:border-action-primary hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
        className,
      )}
      aria-label={label ?? t("close")}
    >
      <FiX aria-hidden="true" />
    </RadixDialog.Close>
  );
}

export const Drawer = Object.assign(DrawerRoot, {
  Header,
  Title,
  Body,
  Close,
});
