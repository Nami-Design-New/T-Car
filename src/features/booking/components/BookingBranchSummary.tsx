import Image from "next/image";
import type { BookingContext } from "@/features/orders";
import { IMAGES } from "@/shared/config/assets";

interface Props {
  branch: NonNullable<BookingContext["branch"]>;
  showroom: string;
  showroomLogo?: string;
  pickupLabel: string;
  returnLabel: string;
  returnTitle: string;
  returnMessage: string;
  distanceLabel: string;
}

export default function BookingBranchSummary({
  branch,
  showroom,
  showroomLogo,
  pickupLabel,
  returnLabel,
  returnTitle,
  returnMessage,
  distanceLabel,
}: Props) {
  return (
    <div className="mb-5 flex flex-col gap-4">
      <section aria-labelledby="booking-pickup-branch">
        <h3
          id="booking-pickup-branch"
          className="mb-2 text-sm font-bold text-text-primary"
        >
          {pickupLabel}
        </h3>
        <div className="flex items-center gap-3 rounded-xl bg-surface-card-primary p-3">
          <Image
            src={showroomLogo || IMAGES.officePlaceholder.src}
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-xl object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-base font-bold text-text-primary">
              {showroom}
            </p>
            <p className="m-0 truncate text-xs text-text-subtle">
              {branch.address}
            </p>
          </div>
          <span className="shrink-0 text-sm text-text-subtle">
            {branch.distanceKm.toLocaleString()} {distanceLabel}
          </span>
        </div>
      </section>

      <section aria-labelledby="booking-return-branch">
        <h3
          id="booking-return-branch"
          className="mb-2 text-sm font-bold text-text-primary"
        >
          {returnLabel}
        </h3>
        <div className="flex items-center gap-3 rounded-xl bg-surface-card-primary p-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-md bg-white">
                <Image
                  src={IMAGES.companyLogoFallback.src}
                  alt=""
                  width={38}
                  height={38}
                  className="object-contain"
                />
              </div>
          <div className="min-w-0 flex-1 ">
            <p className="m-0 text-base font-bold text-text-primary">
              {returnTitle}
            </p>
            <p className="m-0 mt-1 text-sm leading-6 text-text-primary">
              {returnMessage}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
