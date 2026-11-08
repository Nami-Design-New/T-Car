import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Illustration, type IllustrationName } from "@/shared/ui/Illustration";

export interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: IllustrationName | null;
  size?: "page" | "section" | "inline";
  className?: string;
}

/**
 * A successful result with nothing in it (doc 6). Never used for a failure or
 * for "not loaded yet": those are ErrorState and Skeleton.
 */
export function EmptyState({
  title,
  description,
  action,
  illustration = "empty",
  size = "section",
  className,
}: Props) {
  const Heading = size === "inline" ? "p" : "h3";
  const sizeClasses = {
    page: "min-h-[50vh] justify-center px-4 py-10",
    section: " px-4 py-6",
    inline: "p-3",
  };

  return (
    <div
      className={cn(
        "text-text-primary flex flex-col items-center gap-2 text-center",
        sizeClasses[size],
        className,
      )}
    >
      {illustration && size !== "inline" && (
        <Illustration
          name={illustration}
          className={cn(
            "empty-state__illustration min-h-30 w-40",
            illustration === "notFound" && "w-80",
            size === "page" && "w-55",
            illustration === "notFound" && size === "page" && "w-[600px]",
          )}
        />
      )}
      <Heading
        className={cn(
          "m-0 text-base font-semibold",
          size === "inline" && "text-text-subtle text-base font-medium",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="text-text-subtle m-0 max-w-lg text-base">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
