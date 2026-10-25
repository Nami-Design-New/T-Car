"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FiExternalLink, FiHome } from "react-icons/fi";
import { LuPlane } from "react-icons/lu";
import { MdTrain } from "react-icons/md";
import { ICONS } from "@/shared/config/assets";
import { Dialog } from "@/shared/ui/Dialog";
const branchIcon = ICONS.branchCar;
import type { PickupPoint } from "@/features/cars";
import type { CarPickupInfo } from "../model";

interface Props {
  showroom: string;
  pickup: CarPickupInfo;
  type?: PickupPoint;
}

export default function StationAndAirportInfo({
  showroom,
  pickup,
  type = "airport",
}: Props) {
  const t = useTranslations("carDetails.pickup");
  const { address, distanceKm, branches } = pickup;
  const [showBranches, setShowBranches] = useState(false);

  const isAirport = type === "airport";

  return (
    <>
      <section
        className="station-airport-info mt-7 grid gap-[22px] max-sm:gap-3.5"
        aria-label={t("sectionLabel")}
      >
        <div className="station-airport-info-banner rounded-xl bg-surface-card-primary px-[22px] py-[18px] max-sm:rounded-md max-sm:p-4">
          <div className="station-airport-info-heading flex items-center gap-1.5 text-[15px] text-action-primary">
            {isAirport ? (
              <LuPlane className="shrink-0 text-[21px]" aria-hidden="true" />
            ) : (
              <MdTrain className="shrink-0 text-[21px]" aria-hidden="true" />
            )}
            <strong>{isAirport ? t("airportTitle") : t("stationTitle")}</strong>
          </div>
          <p className="m-0 mt-2 text-[13px] leading-[1.7] text-text-primary">
            {isAirport ? t("airportDescription") : t("stationDescription")}
          </p>
        </div>

        <div className="station-airport-info-branch flex min-h-32 justify-between gap-6 rounded-xl border border-stroke-light bg-surface-elevated px-[22px] py-[18px] shadow-[0_2px_8px_rgba(30,30,30,0.06)] max-sm:gap-3 max-sm:rounded-md max-sm:p-4">
          <div className="station-airport-info-branch-main min-w-0">
            <span className="station-airport-info-eyebrow flex items-center gap-1.5 text-[13px] font-bold text-action-primary">
              <FiHome aria-hidden="true" />
              {t("nearestBranch")}
            </span>
            <h3 className="mb-1 mt-2 text-base font-bold text-text-primary">
              {showroom}
            </h3>
            <p className="m-0 text-[13px] leading-[1.7] text-text-primary">
              {address}
            </p>
          </div>

          <div className="station-airport-info-branch-meta flex shrink-0 flex-col items-end justify-between">
            <button
              type="button"
              className="station-airport-info-branches-trigger inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-bold text-text-primary underline underline-offset-3 hover:text-action-primary"
              aria-label={t("viewBranch", { showroom })}
              onClick={() => setShowBranches(true)}
            >
              <FiExternalLink aria-hidden="true" />
              {t("branches")}
            </button>
            <span className="text-xs text-text-subtle">
              {distanceKm.toLocaleString()} {t("km")}
            </span>
          </div>
        </div>
      </section>

      <Dialog
        open={showBranches}
        onClose={() => setShowBranches(false)}
        placement="center"
      >
        <Dialog.Header>
          <Dialog.Title>{t("branches")}</Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>

        <Dialog.Body className="grid gap-2 min-h-0 overflow-y-auto mt-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {branches.map((branch, index) => (
            <article
              key={index}
              className="branches-info-item grid min-h-17 grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md bg-surface-card-primary px-3 py-2"
            >
              <span
                className="branches-info-icon grid size-9.5 place-items-center rounded-sm bg-surface-elevated"
                aria-hidden="true"
              >
                <Image src={branchIcon} alt="" width={24} height={24} />
              </span>

              <div className="branches-info-content min-w-0">
                <h3 className="mb-1 text-[13px] font-semibold text-text-primary">
                  {branch.name}
                </h3>
                <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] leading-normal text-text-primary">
                  {branch.address}
                </p>
              </div>

              <span className="whitespace-nowrap text-[10px] text-text-subtle">
                {branch.distanceKm.toLocaleString()} {t("km")}
              </span>
            </article>
          ))}
        </Dialog.Body>
      </Dialog>
    </>
  );
}
