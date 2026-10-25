"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { useRef, type ReactNode, type RefObject } from "react";
import { FiX } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

const dialogSizeClasses = {
  sm: "max-w-[400px]",
  md: "max-w-[520px]",
  lg: "max-w-[720px]",
  xl: "max-w-[960px]",
  fullscreen: "h-screen max-h-none w-screen max-w-none rounded-none",
};

const dialogPlacementClasses = {
  center: "",
  "bottom-sheet":
    "max-[575px]:bottom-0 max-[575px]:left-0 max-[575px]:top-auto max-[575px]:w-screen max-[575px]:max-h-[90dvh] max-[575px]:max-w-none max-[575px]:translate-x-0 max-[575px]:translate-y-0 max-[575px]:rounded-b-none max-[575px]:rounded-t-xl max-[575px]:pb-[env(safe-area-inset-bottom)] max-[575px]:animate-[dialog-sheet-in_0.18s_ease-out]",
};

const dialogContentBaseClasses =
  "fixed left-1/2 top-1/2 z-[10001] flex max-h-[calc(100dvh-2.5rem)] w-[calc(100vw-2.5rem)] -translate-x-1/2 -translate-y-1/2 origin-center flex-col gap-3 rounded-lg bg-surface-elevated p-6 text-text-primary shadow-[0_20px_48px_rgba(30,30,30,0.18)] outline-none animate-[dialog-pop-in_0.18s_ease-out] motion-reduce:animate-none";

export interface DialogProps {
  open: boolean;
  /** The one close request: Escape, backdrop, or a Dialog.Close. */
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
  /** `bottom-sheet` docks to the bottom on small screens; centered on desktop. */
  placement?: "center" | "bottom-sheet";
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  /** Allow preview/tooling controls outside the surface to receive pointer events. */
  modal?: boolean;
  /** First element to focus on open; defaults to the first focusable one. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Accessible name when the dialog has no visible Dialog.Title. */
  label?: string;
  /** Styling hook on the surface (not the backdrop). */
  className?: string;
}

/**
 * The one modal shell (DIALOG_MIGRATION_PLAN.md, doc 4). Radix supplies the
 * portal, focus trap and restore, scroll lock, stacking, and dismissal;
 * callers only compose content. Radix stays an internal detail.
 */
function DialogRoot({
  open,
  onClose,
  children,
  size = "md",
  placement = "center",
  closeOnEscape = true,
  closeOnBackdrop = true,
  modal = true,
  initialFocusRef,
  label,
  className,
}: DialogProps) {
  const openerRef = useRef<HTMLElement | null>(null);

  return (
    <RadixDialog.Root
      open={open}
      modal={modal}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog-backdrop fixed inset-0 z-10000 bg-[rgba(30,30,30,0.45)] animate-[dialog-fade-in_0.15s_ease-out] motion-reduce:animate-none" />
        <RadixDialog.Content
          aria-modal="true"
          aria-label={label}
          className={cn(
            "dialog",
            `dialog--${size}`,
            `dialog--${placement}`,
            dialogContentBaseClasses,
            dialogSizeClasses[size],
            dialogPlacementClasses[placement],
            className,
          )}
          onEscapeKeyDown={(event) => {
            if (!closeOnEscape) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!closeOnBackdrop) event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            // Runs before Radix moves focus in, so this is still the opener.
            openerRef.current = document.activeElement as HTMLElement | null;
            if (initialFocusRef?.current) {
              event.preventDefault();
              initialFocusRef.current.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            // Radix only restores focus to its own Trigger; these dialogs are
            // controlled by `open`, so return focus to whatever opened them.
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
    <div
      className={cn(
        "dialog__header flex items-center justify-between gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Title({ children, className }: PartProps) {
  return (
    <RadixDialog.Title
      className={cn("dialog__title m-0 text-xl font-semibold", className)}
    >
      {children}
    </RadixDialog.Title>
  );
}

function Description({ children, className }: PartProps) {
  return (
    <RadixDialog.Description
      className={cn(
        "dialog__description mx-6 mt-2 mb-0 text-text-subtle",
        className,
      )}
    >
      {children}
    </RadixDialog.Description>
  );
}

/** The only part that scrolls, so the header and footer stay reachable. */
function Body({ children, className }: PartProps) {
  return (
    <div
      className={cn("scrollbar-none min-h-0 flex-1 overflow-y-auto", className)}
    >
      {children}
    </div>
  );
}

function Footer({ children, className }: PartProps) {
  return (
    <div
      className={cn(
        "dialog__footer flex flex-wrap justify-end gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Icon close button with a localized label. */
function Close({ className }: { className?: string }) {
  const t = useTranslations("states.dialog");
  return (
    <RadixDialog.Close
      className={cn(
        "dialog__close inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-neutral-100 text-lg text-text-primary hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2",
        className,
      )}
      aria-label={t("close")}
    >
      <FiX aria-hidden="true" />
    </RadixDialog.Close>
  );
}

export const Dialog = Object.assign(DialogRoot, {
  Header,
  Title,
  Description,
  Body,
  Footer,
  Close,
});
