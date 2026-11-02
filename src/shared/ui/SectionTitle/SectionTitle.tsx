import { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface SectionTitleProps {
  smallTitle?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
}

export function SectionTitle({
  smallTitle,
  title,
  subtitle,
  align = "center",
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "min-w-0",
        align === "center" ? "is-center text-center" : "is-left text-start",
      )}
    >
      {smallTitle && (
        <span
          className={cn(
            "bg-surface-card-primary text-action-primary mb-4 inline-flex items-center justify-center rounded-full px-4 py-[0.45rem] text-[0.9rem] font-semibold",
            align === "center" && "mx-auto",
          )}
        >
          {smallTitle}
        </span>
      )}

      <h2
        className={cn(
          "text-text-primary m-0 text-[clamp(2rem,2vw,2.8rem)] leading-[1.3] font-bold max-md:text-base",
          Boolean(subtitle) && "mb-2 max-md:mb-1",
        )}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className={cn(
            "text-text-subtle m-0 max-w-162.5 text-base leading-[1.9] max-md:text-sm max-md:leading-[1.7]",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
