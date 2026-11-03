import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

interface Props {
  label: string;
  selected: boolean;
  onToggle: () => void;
  /** Shown before the label, e.g. a brand logo. */
  visual?: ReactNode;
}

/** A toggle chip for a multi-select filter; a selected chip shows a remove mark. */
export default function FilterChip({
  label,
  selected,
  onToggle,
  visual,
}: Props) {
  return (
    <button
      type="button"
      className={cn(
        "filter_chip bg-surface-on-background text-text-primary hover:border-action-primary/25 hover:bg-surface-card-primary inline-flex min-h-[42px] max-w-full flex-[0_1_auto] items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 transition duration-200 hover:-translate-y-px",
        selected &&
          "is-selected border-action-primary! bg-action-primary! text-text-on-action! shadow-[0_7px_16px_rgba(31,127,250,0.18)]",
      )}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {visual && (
        <span className="filter_chip_visual bg-surface-elevated grid size-6.5 shrink-0 place-items-center rounded-full">
          {visual}
        </span>
      )}
      <span className="filter_chip_label min-w-0 overflow-hidden text-[13px] leading-[1.35] font-medium text-ellipsis whitespace-nowrap">
        {label}
      </span>
      {selected && (
        <span
          className="bg-surface-elevated text-text-primary grid size-[21px] shrink-0 place-items-center rounded-full"
          aria-hidden="true"
        >
          <FiX className="text-sm" />
        </span>
      )}
    </button>
  );
}
