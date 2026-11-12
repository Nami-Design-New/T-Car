import Image from "next/image";
import { LuPlane } from "react-icons/lu";
import { MdTrain } from "react-icons/md";
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
  /**
   * Airport / station without a company branch there (R19): pickup is that
   * place instead of the branch; the return keeps the static nearest-branch text.
   */
  pickupPlace?: { kind: "airport" | "station"; title: string };
  /** Airport / station with a company branch there (R19): return to that branch too. */
  returnAtBranch?: boolean;
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
  pickupPlace,
  returnAtBranch = false,
}: Props) {
  const branchCard = (
    <div className="bg-surface-card-primary flex items-center gap-3 rounded-xl p-3">
      <Image
        src={showroomLogo || IMAGES.officePlaceholder.src}
        alt=""
        width={48}
        height={48}
        className="size-12 rounded-xl object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="text-text-primary m-0 truncate text-base font-bold">
          {showroom}
        </p>
        <p className="text-text-subtle m-0 truncate text-xs">
          {branch.address}
        </p>
      </div>
      <span className="text-text-subtle shrink-0 text-sm">
        {branch.distanceKm.toLocaleString()} {distanceLabel}
      </span>
    </div>
  );
  const PlaceIcon = pickupPlace?.kind === "station" ? MdTrain : LuPlane;

  return (
    <div className="mb-5 flex flex-col gap-4">
      <section aria-labelledby="booking-pickup-branch">
        <h3
          id="booking-pickup-branch"
          className="text-text-primary mb-2 text-sm font-bold"
        >
          {pickupLabel}
        </h3>
        {pickupPlace ? (
          <div className="bg-surface-card-primary flex items-center gap-3 rounded-xl p-3">
            <span className="text-action-primary grid size-12 shrink-0 place-items-center rounded-xl bg-white text-2xl">
              <PlaceIcon aria-hidden="true" />
            </span>
            <p className="text-text-primary m-0 min-w-0 flex-1 truncate text-base font-bold">
              {pickupPlace.title}
            </p>
          </div>
        ) : (
          branchCard
        )}
      </section>

      <section aria-labelledby="booking-return-branch">
        <h3
          id="booking-return-branch"
          className="text-text-primary mb-2 text-sm font-bold"
        >
          {returnLabel}
        </h3>
        {returnAtBranch ? (
          branchCard
        ) : (
          <div className="bg-surface-card-primary flex items-center gap-3 rounded-xl p-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-md bg-white">
              <Image
                src={IMAGES.companyLogoFallback.src}
                alt=""
                width={38}
                height={38}
                className="object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-text-primary m-0 text-base font-bold">
                {returnTitle}
              </p>
              <p className="text-text-primary m-0 mt-1 text-sm leading-6">
                {returnMessage}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
