"use client";

import { useId, useRef } from "react";
import { FiStar } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

export interface StarRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  starLabel: (count: number) => string;
  className?: string;
  errorId?: string;
  invalid?: boolean;
}

export function StarRating({
  label,
  value,
  onChange,
  starLabel,
  className,
  errorId,
  invalid = false,
}: StarRatingProps) {
  const labelId = useId();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectAndFocus = (nextValue: number) => {
    const boundedValue = Math.max(1, Math.min(5, nextValue));
    onChange(boundedValue);
    buttonRefs.current[boundedValue - 1]?.focus();
  };

  return (
    <div className={cn("w-full", className)}>
      <p
        id={labelId}
        className="mb-2 text-start text-sm font-semibold text-text-primary"
      >
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        className="flex w-full justify-center gap-3 [direction:ltr]"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            ref={(element) => {
              buttonRefs.current[star - 1] = element;
            }}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={starLabel(star)}
            tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
            data-rating={star}
            className={cn(
              "grid size-8 cursor-pointer place-items-center border-0 bg-transparent transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-action-primary",
              value >= star ? "text-gauge-amber" : "text-stroke-heavy",
            )}
            onClick={() => onChange(star)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                selectAndFocus(star + 1);
              } else if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowDown"
              ) {
                event.preventDefault();
                selectAndFocus(star - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                selectAndFocus(1);
              } else if (event.key === "End") {
                event.preventDefault();
                selectAndFocus(5);
              }
            }}
          >
            <FiStar className="size-6 fill-current" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
