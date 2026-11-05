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
import type { CarPickupInfo, PickupBranch } from "../model";

interface Props {
  showroom: string;
  pickup: CarPickupInfo;
  branches: PickupBranch[];
  type?: PickupPoint;
}

export default function StationAndAirportInfo({
  showroom,
  pickup,
  branches,
  type,
}: Props) {
  const t = useTranslations("carDetails.pickup");
  const nearestBranch = pickup.nearestBranch;
  const [showBranches, setShowBranches] = useState(false);

  if (!nearestBranch) return null;

  const isAirport = type === "airport";

  return (
    <>
      <section
        className="station-airport-info mt-7 grid gap-5.5 max-sm:gap-3.5"
        aria-label={t("sectionLabel")}
      >
        {type && (
          <div className="station-airport-info-banner bg-surface-card-primary rounded-xl px-5.5 py-4.5 max-sm:rounded-md max-sm:p-4">
            <div className="station-airport-info-heading text-action-primary flex items-center gap-1.5 text-[15px]">
              {isAirport ? (
                <LuPlane className="shrink-0 text-[21px]" aria-hidden="true" />
              ) : (
                <MdTrain className="shrink-0 text-[21px]" aria-hidden="true" />
              )}
              <strong>
                {isAirport ? t("airportTitle") : t("stationTitle")}
              </strong>
            </div>
            <p className="text-text-primary m-0 mt-2 text-[13px] leading-[1.7]">
              {isAirport ? t("airportDescription") : t("stationDescription")}
            </p>
          </div>
        )}

        <div className="station-airport-info-branch border-stroke-light bg-surface-elevated flex min-h-32 justify-between gap-6 rounded-xl border px-5.5 py-4.5 shadow-[0_2px_8px_rgba(30,30,30,0.06)] max-sm:gap-3 max-sm:rounded-md max-sm:p-4">
          <div className="station-airport-info-branch-main min-w-0">
            <span className="station-airport-info-eyebrow text-action-primary flex items-center gap-1.5 text-[13px] font-bold">
              <FiHome aria-hidden="true" />
              {t("nearestBranch")}
            </span>
            <h3 className="text-text-primary mt-2 mb-1 text-base font-bold">
              {nearestBranch.name || showroom}
            </h3>
            <p className="text-text-primary m-0 text-[13px] leading-[1.7]">
              {nearestBranch.address}
            </p>
          </div>

          <div className="station-airport-info-branch-meta flex shrink-0 flex-col items-end justify-between">
            {branches.length > 0 && (
              <button
                type="button"
                className="station-airport-info-branches-trigger text-text-primary hover:text-action-primary inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-bold underline underline-offset-3"
                aria-label={t("viewBranch", { showroom })}
                onClick={() => setShowBranches(true)}
              >
                <FiExternalLink aria-hidden="true" />
                {t("branches")}
              </button>
            )}
            <span className="text-text-subtle text-xs">
              {nearestBranch.distanceKm.toLocaleString()} {t("km")}
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

        <Dialog.Body className="mt-4 grid min-h-0 scrollbar-none gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {branches.map((branch) => (
            <article
              key={branch.id}
              className="branches-info-item bg-surface-card-primary grid min-h-17 grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md px-3 py-2"
            >
              <span
                className="branches-info-icon bg-surface-elevated grid size-9.5 place-items-center rounded-sm"
                aria-hidden="true"
              >
                <Image src={branchIcon} alt="" width={24} height={24} />
              </span>

              <div className="branches-info-content min-w-0">
                <h3 className="text-text-primary mb-1 text-[13px] font-semibold">
                  {branch.name}
                </h3>
                <p className="text-text-primary overflow-hidden text-[10px] leading-normal text-ellipsis whitespace-nowrap">
                  {branch.address}
                </p>
              </div>

              <span className="text-text-subtle text-[10px] whitespace-nowrap">
                {branch.distanceKm.toLocaleString()} {t("km")}
              </span>
            </article>
          ))}
        </Dialog.Body>
      </Dialog>
    </>
  );
}
