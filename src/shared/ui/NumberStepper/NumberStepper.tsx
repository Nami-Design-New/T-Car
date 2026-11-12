"use client";

import Image from "next/image";
import { ICONS } from "@/shared/config/assets";
import { Button } from "@/shared/ui/Button";

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  min?: number;
  disabled?: boolean;
}

export function NumberStepper({
  value,
  onChange,
  decreaseLabel,
  increaseLabel,
  min = 1,
  disabled = false,
}: NumberStepperProps) {
  return (
    <div className="flex items-center justify-center gap-8 [direction:ltr]">
      <button
        type="button"
        className="grid size-7 place-items-center rounded-sm border-0 bg-white disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={decreaseLabel}
      >
        <Image
          src={ICONS.minus.src}
          alt=""
          width={ICONS.minus.width}
          height={ICONS.minus.height}
        />
      </button>
      <strong className="text-text-primary min-w-40 text-5xl tabular-nums">
        {value}
      </strong>
      <button
        type="button"
        className="grid size-7 place-items-center rounded-sm border-0 bg-white disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label={increaseLabel}
      >
        <Image
          src={ICONS.plus.src}
          alt=""
          width={ICONS.plus.width}
          height={ICONS.plus.height}
        />
      </button>
    </div>
  );
}
