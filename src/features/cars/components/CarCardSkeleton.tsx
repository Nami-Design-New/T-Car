import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";

interface Props {
  className?: string;
}

/** A `CarCard` while it loads: same outline, image, title, office, and price. */
export default function CarCardSkeleton({ className }: Props) {
  return (
    <div
      className={cn(
        "bg-surface-background flex h-full min-w-0 flex-col overflow-hidden rounded-xl shadow-[0_7px_24px_rgba(30,30,30,0.055)]",
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton shape="rect" className="h-52.5 rounded-none max-sm:h-46" />
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton width="55%" height={18} />
          <Skeleton
            shape="rect"
            width={48}
            height={26}
            className="rounded-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton shape="rect" width={44} height={44} className="rounded" />
          <Skeleton width="40%" />
        </div>
        <Skeleton width="35%" height={20} className="mt-auto" />
      </div>
    </div>
  );
}
