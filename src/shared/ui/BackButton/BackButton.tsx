"use client";

import type { ButtonHTMLAttributes } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import "./BackButton.scss";
import { ICONS } from "@/shared/config/assets";
import Image from "next/image";

export interface BackButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick"
> {
  label?: string;
}

export function BackButton({ label, className, ...rest }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={cn("back-button", className)}
      onClick={() => router.back()}
      {...rest}
    >
      <Image
        src={ICONS.chevron.src}
        width={ICONS.chevron.width}
        height={ICONS.chevron.height}
        alt="Back"
        className="back-button__icon"
        aria-hidden="true"
      />
      {label && <span>{label}</span>}
    </button>
  );
}
