'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { useRef, type ReactNode, type RefObject } from 'react';
import { FiX } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import './Dialog.scss';

export interface DialogProps {
  open: boolean;
  /** The one close request: Escape, backdrop, or a Dialog.Close. */
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  /** `bottom-sheet` docks to the bottom on small screens; centered on desktop. */
  placement?: 'center' | 'bottom-sheet';
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
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
  size = 'md',
  placement = 'center',
  closeOnEscape = true,
  closeOnBackdrop = true,
  initialFocusRef,
  label,
  className,
}: DialogProps) {
  const openerRef = useRef<HTMLElement | null>(null);

  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog-backdrop" />
        <RadixDialog.Content
          aria-modal="true"
          aria-label={label}
          className={cn('dialog', `dialog--${size}`, `dialog--${placement}`, className)}
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
  return <div className={cn('dialog__header', className)}>{children}</div>;
}

function Title({ children, className }: PartProps) {
  return (
    <RadixDialog.Title className={cn('dialog__title', className)}>{children}</RadixDialog.Title>
  );
}

function Description({ children, className }: PartProps) {
  return (
    <RadixDialog.Description className={cn('dialog__description', className)}>
      {children}
    </RadixDialog.Description>
  );
}

/** The only part that scrolls, so the header and footer stay reachable. */
function Body({ children, className }: PartProps) {
  return <div className={cn('dialog__body', className)}>{children}</div>;
}

function Footer({ children, className }: PartProps) {
  return <div className={cn('dialog__footer', className)}>{children}</div>;
}

/** Icon close button with a localized label. */
function Close({ className }: { className?: string }) {
  const t = useTranslations('states.dialog');
  return (
    <RadixDialog.Close className={cn('dialog__close', className)} aria-label={t('close')}>
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
