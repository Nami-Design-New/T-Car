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
        "section-title ",
        align === "center" ? "is-center text-center" : "is-left text-start",
      )}
    >
      {smallTitle && (
        <span
          className={cn(
            "section-title-eyebrow mb-4 inline-flex items-center justify-center rounded-full bg-surface-card-primary px-4 py-[0.45rem] text-[0.9rem] font-semibold text-action-primary",
            align === "center" && "mx-auto",
          )}
        >
          {smallTitle}
        </span>
      )}

      <h2 className="section-title-heading m-0 mb-2  text-[clamp(2rem,3vw,2.8rem)] font-bold leading-[1.3] text-text-primary">
        {title}
      </h2>

      {subtitle && (
        <p
          className={cn(
            "section-title-subtitle max-w-[650px] m-0 text-base leading-[1.9] text-text-subtle",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
