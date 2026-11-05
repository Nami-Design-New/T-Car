"use client";

import { useTranslations } from "next-intl";
import { Tabs } from "@/shared/ui/Tabs";
import type { CarPolicies } from "../model";

interface Props {
  policies: CarPolicies;
}

function PolicyItems({ items }: { items: string[] }) {
  return (
    <ul className="text-text-subtle marker:text-text-subtle m-0 flex list-disc flex-col gap-3 ps-5 text-start text-sm leading-[1.8]">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function PoliciesList({ policies }: Props) {
  const t = useTranslations("carDetails.policies");
  if (
    policies.clientInstructions.length === 0 &&
    policies.cancellationPolicies.length === 0
  ) {
    return null;
  }

  return (
    <section className="border-stroke-light mt-8 border-t pt-6">
      <Tabs.Root defaultValue="instructions" className="w-full">
        <Tabs.List className="mb-6 flex justify-end gap-2 border-0">
          <Tabs.Trigger
            value="instructions"
            className="text-text-primary data-[state=active]:bg-action-primary data-[state=active]:text-text-on-action rounded-full bg-white px-5 py-2 text-center text-sm font-bold"
          >
            {t("instructions")}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="cancellation"
            className="text-text-primary data-[state=active]:bg-action-primary data-[state=active]:text-text-on-action rounded-full bg-white px-5 py-2 text-center text-sm font-bold"
          >
            {t("cancellation")}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="instructions">
          <PolicyItems items={policies.clientInstructions} />
        </Tabs.Content>
        <Tabs.Content value="cancellation">
          <PolicyItems items={policies.cancellationPolicies} />
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
