import { Skeleton } from "@/shared/ui/Skeleton";
import CarCardSkeleton from "./CarCardSkeleton";

/**
 * A `CarOfficeRow` while it loads: the office title, then as many cards as
 * the row shows at this width (1, 2 from 576px, 3 from 992px).
 */
export default function CarOfficeRowSkeleton() {
  return (
    <div className="min-w-0" aria-hidden="true">
      <div className="mb-5 flex min-h-20.5 items-center gap-4 max-md:min-h-[72px] max-md:p-4">
        <Skeleton shape="rect" width={56} height={56} className="shrink-0" />
        <Skeleton width="40%" height={24} />
      </div>
      <div className="grid grid-cols-1 gap-[14px] px-0.5 pb-1.5 sm:grid-cols-2 sm:gap-[18px] lg:grid-cols-3 lg:gap-5">
        <CarCardSkeleton />
        <CarCardSkeleton className="max-sm:hidden" />
        <CarCardSkeleton className="max-lg:hidden" />
      </div>
    </div>
  );
}
