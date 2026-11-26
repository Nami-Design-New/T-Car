"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FiInfo, FiShare2 } from "react-icons/fi";
import { Dialog } from "@/shared/ui/Dialog";
import PerkIcon from "./PerkIcon";
import PerkRow from "./PerkRow";

/** Earning guidance shared by every reward tier detail page. */
export default function EarnPointsDialog() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("rewards.detail");
  const earn = [
    {
      id: "trip",
      icon: <PerkIcon perkKey="free_delivery_every_bookings" />,
      title: t("earn.tripTitle"),
      description: t("earn.tripDescription"),
    },
    {
      id: "review",
      icon: <PerkIcon perkKey="bronze_welcome" />,
      title: t("earn.reviewTitle"),
      description: t("earn.reviewDescription"),
    },
    {
      id: "invite",
      icon: <FiShare2 aria-hidden="true" />,
      title: t("earn.inviteTitle"),
      description: t("earn.inviteDescription"),
      href: "/account/referrals",
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-action-primary hover:text-primary-600 inline-flex items-center gap-1 self-start text-sm font-semibold underline underline-offset-2"
      >
        <FiInfo aria-hidden="true" />
        {t("earnTitle")}
      </button>
      {open && (
        <Dialog
          open
          onClose={() => setOpen(false)}
          size="lg"
          className="bg-[#f1f7ff]! max-[575px]:p-4"
        >
          <Dialog.Header>
            <Dialog.Title className="text-lg font-bold">
              {t("earnTitle")}
            </Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body className="flex flex-col gap-3 pt-1">
            {earn.map((item) => (
              <PerkRow
                key={item.id}
                title={item.title}
                description={item.description}
                icon={item.icon}
                unlocked
                href={item.href}
              />
            ))}
          </Dialog.Body>
        </Dialog>
      )}
    </>
  );
}
