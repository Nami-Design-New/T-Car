"use client";

import { cn } from "@/shared/lib/cn";
import { Accordion } from "@/shared/ui/Accordion";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import type { CarWarranty } from "../model";
import { ICONS } from "@/shared/config/assets";
import HtmlContent from "./HtmlContent";

const filledShiled = ICONS.filledShiled;

interface Props {
  warranties: CarWarranty[];
}

export default function WarrantiesList({ warranties }: Props) {
  const t = useTranslations("carDetails");
  // All closed at first; '' is Radix's "none open" for a single accordion.
  const [openId, setOpenId] = useState("");

  if (warranties.length === 0) {
    return (
      <section className="details-section border-stroke-light mt-8 border-t pt-6">
        <h3 className="text-text-primary mb-4.5 text-[1.15rem] font-bold">
          {t("warranties")}
        </h3>
        <EmptyState
          size="inline"
          illustration={null}
          title={t("noWarranties")}
        />
      </section>
    );
  }

  return (
    <section className="details-section border-stroke-light mt-8 border-t pt-6">
      <h3 className="text-text-primary mb-4.5 text-[1.15rem] font-bold">
        {t("warranties")}
      </h3>

      <Accordion.Root
        type="single"
        collapsible
        value={openId}
        onValueChange={setOpenId}
        className="warranties-list flex flex-col gap-2.5"
      >
        {warranties.map((w) => (
          <Accordion.Item
            key={w.id}
            value={w.id}
            className="warranty-item border-stroke-light overflow-hidden rounded-md border"
          >
            <Accordion.Trigger className="warranty-item-header bg-surface-elevated flex w-full items-center gap-3 border-0 px-4 py-3.5 text-start">
              <Image
                src={filledShiled.src}
                alt=""
                width={filledShiled.width}
                height={filledShiled.height}
              />

              <span className="warranty-title text-text-primary flex-1 text-start text-[0.92rem] font-semibold">
                {w.title}
              </span>
              <FiChevronDown
                aria-hidden="true"
                className={cn(
                  "warranty-chevron text-text-subtle transition duration-300",
                  openId === w.id && "rotate-180",
                )}
              />
            </Accordion.Trigger>

            <Accordion.Content>
              <HtmlContent
                html={w.content}
                className="text-text-subtle px-4 py-4 ps-13 text-sm leading-[1.7]"
              />
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
