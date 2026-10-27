"use client";

import type { ButtonHTMLAttributes } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { ICONS } from "@/shared/config/assets";
import Image from "next/image";

export interface BackButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick"
> {
  label?: string;
  onClick?: () => void;
}

export function BackButton({
  label,
  className,
  onClick,
  ...rest
}: BackButtonProps) {
  const router = useRouter();
  const handleOnClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };
  return (
    <button
      type="button"
      className={cn(
        "border-stroke-light bg-surface-background hover:text-action-primary focus-visible:outline-action-primary inline-flex cursor-pointer items-center justify-center rounded-md border p-[3px] focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-3",
        className,
      )}
      onClick={handleOnClick}
      {...rest}
    >
      <Image
        src={ICONS.chevron.src}
        width={ICONS.chevron.width}
        height={ICONS.chevron.height}
        alt="Back"
        aria-hidden="true"
      />
      {label && <span>{label}</span>}
    </button>
  );
}
