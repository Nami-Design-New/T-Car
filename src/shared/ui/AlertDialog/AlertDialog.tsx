"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "../Button";
import { RESULT_ANIMATIONS } from "@/shared/config/assets";
import Image from "next/image";

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
      size="md"
      closeOnEscape={!loading}
      initialFocusRef={showButtons ? cancelRef : undefined}
    >
      <Dialog.Body>
        <Image
          className="mx-auto mb-2 block size-45 object-contain max-[575px]:size-37.5"
          src={RESULT_ANIMATIONS.error}
          alt=""
          width={180}
          height={180}
          unoptimized
        />

        <div className="flex flex-col items-center">
          {title && (
            <Dialog.Title
              className={cn(
                "m-0 font-bold",
                showButtons ? "text-base" : "text-[18px]",
              )}
            >
              {title}
            </Dialog.Title>
          )}
          {description && (
            <Dialog.Description className="text-text-subtle mx-0 mt-0 mb-0 max-w-97.5 text-center text-[14px] leading-[1.8]">
              {description}
            </Dialog.Description>
          )}
          {error && (
            <p className="text-status-error mt-2 mb-0 text-sm" role="alert">
              {error}
            </p>
          )}
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        {showButtons && (
          <div className="flex w-full gap-2.5">
            <Button
              type="button"
              size="lg"
              variant="destructive"
              className="flex-1"
              disabled={loading}
              aria-busy={loading}
              loading={loading}
              onClick={onPrimary}
            >
              {primaryButtonText}
            </Button>
            <Button
              ref={cancelRef}
              type="button"
              size="lg"
              className="flex-1"
              disabled={loading}
              aria-busy={loading}
              variant="outline"
              onClick={onSecondary}
            >
              {secondaryButtonText}
            </Button>
          </div>
        )}
      </Dialog.Footer>
    </Dialog>
  );
}
