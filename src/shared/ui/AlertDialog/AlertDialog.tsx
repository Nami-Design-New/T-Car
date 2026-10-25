"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { Dialog } from "@/shared/ui/Dialog";

export interface Props {
  open: boolean;
  title?: string;
  description?: string;
  onDone?: () => void;
  autoCloseDuration?: number;
  showButtons?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  loading?: boolean;
  error?: string;
  onPrimary?: () => void | Promise<void>;
  onSecondary?: () => void;
}

/** The failure/confirmation surface used for account deletion. */
export function AlertDialog({
  open,
  title,
  description,
  onDone,
  autoCloseDuration = 2000,
  showButtons = false,
  primaryButtonText = "Confirm",
  secondaryButtonText = "Cancel",
  loading = false,
  error,
  onPrimary,
  onSecondary,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const hasOnDone = !!onDone;

  useEffect(() => {
    if (!open || showButtons || !hasOnDone) return;

    const timer = setTimeout(() => onDoneRef.current?.(), autoCloseDuration);
    return () => clearTimeout(timer);
  }, [open, hasOnDone, autoCloseDuration, showButtons]);

  const handleClose = () => {
    if (showButtons) {
      if (!loading) onSecondary?.();
      return;
    }

    onDone?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="sm"
      className={cn(
        " flex  flex-col items-center justify-between rounded-xl bg-surface-elevated px-7 py-9",
        showButtons &&
          "px-5 pt-6 pb-5 text-center",
      )}
      closeOnEscape={!loading}
      initialFocusRef={showButtons ? cancelRef : undefined}
    >
      <div
        className="  relative grid size-23.5 shrink-0 place-items-center rounded-full bg-status-error"
        aria-hidden="true"
      >
        <span className="absolute h-2.75 w-18 rounded-full bg-text-on-action rotate-45" />
        <span className="absolute h-2.75 w-18 rounded-full bg-text-on-action -rotate-45" />
      </div>

      <div className=" flex flex-col items-center">
        {title && (
          <Dialog.Title
            className={cn(
              "m-0 font-bold text-text-primary",
              showButtons ? "text-base" : "text-[17px]",
            )}
          >
            {title}
          </Dialog.Title>
        )}
        {description && (
          <Dialog.Description className="mx-0 mt-0 mb-0 max-w-97.5 text-[14px] leading-[1.8] text-text-subtle">
            {description}
          </Dialog.Description>
        )}
        {error && (
          <p className="mt-2 mb-0 text-sm text-status-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {showButtons && (
        <div className=" mt-5.5 flex w-full gap-2.5">
          <button
            type="button"
            className=" h-10.5 flex-1 cursor-pointer rounded-sm border border-status-error bg-status-error text-[13px] font-semibold text-text-on-action transition duration-200 hover:bg-status-error/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            aria-busy={loading}
            onClick={onPrimary}
          >
            {primaryButtonText}
          </button>
          <button
            ref={cancelRef}
            type="button"
            className=" h-10.5 flex-1 cursor-pointer rounded-sm border border-action-primary bg-surface-elevated text-[13px] font-semibold text-action-primary transition duration-200 hover:bg-surface-card-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            onClick={onSecondary}
          >
            {secondaryButtonText}
          </button>
        </div>
      )}
    </Dialog>
  );
}
