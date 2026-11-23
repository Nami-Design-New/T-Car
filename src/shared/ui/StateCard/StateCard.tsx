import Image from "next/image";
import type { ReactNode } from "react";
import { STATE_ICONS } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";

export interface StateCardProps {
  icon: keyof typeof STATE_ICONS;
  title: string;
  description?: string;
  /** Sits under the card: full width on phones, centred on wider screens. */
  action?: ReactNode;
  /** `alert` announces a failure to screen readers. */
  role?: "status" | "alert";
  /** h3 when the card sits under the page's own heading. */
  headingLevel?: 2 | 3;
  className?: string;
}

/**
 * The design's empty and failed-load state: a white card with a line icon,
 * a title, and a line of help, and the next step as a button below it.
 */
export function StateCard({
  icon,
  title,
  description,
  action,
  role,
  headingLevel = 2,
  className,
}: StateCardProps) {
  const image = STATE_ICONS[icon];
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <div className={cn("flex flex-col gap-4", className)} role={role}>
      <div className="border-stroke-light bg-surface-elevated flex flex-col items-center gap-3 rounded-2xl border px-4 py-12 text-center">
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt=""
          aria-hidden="true"
        />
        <Heading className="text-text-primary m-0 text-xl font-semibold">
          {title}
        </Heading>
        {description && (
          <p className="text-text-subtle m-0 max-w-md text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex justify-center max-sm:*:w-full sm:*:min-w-64">
          {action}
        </div>
      )}
    </div>
  );
}
