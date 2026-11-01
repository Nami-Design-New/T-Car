"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Dialog } from "@/shared/ui/Dialog";
import { RESULT_ANIMATIONS } from "@/shared/config/assets";
import { Button } from "../Button";

export interface Props {
  open: boolean;
  status: "success" | "error";
  description?: string;
  action?: { label: string; onClick: () => void };
  autoCloseMs?: number;
  onClose: () => void;
}

/** A controlled success/error notice with an optional action and auto-close. */
export function ResultDialog({
  open,
  status,
  description,
  action,
  autoCloseMs = 2000,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open || autoCloseMs <= 0) return;
    const timeout = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timeout);
  }, [autoCloseMs, onClose, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      placement="bottom-sheet"
      closeOnBackdrop
      label={description || status}
    >
      <Dialog.Body className="flex flex-col items-center px-8 pt-5 pb-8 text-center max-[575px]:px-5">
        <Image
          className="mx-auto mb-2 block size-45 object-contain max-[575px]:size-37.5"
          src={RESULT_ANIMATIONS[status]}
          alt=""
          width={180}
          height={180}
          unoptimized
        />
        {description && (
          <Dialog.Description className="text-text-primary! mx-0 font-semibold">
            {description}
          </Dialog.Description>
        )}
        {action && (
          <Button
            type="button"
            size="lg"
            className="mt-4 w-full max-w-50"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </Dialog.Body>
    </Dialog>
  );
}
