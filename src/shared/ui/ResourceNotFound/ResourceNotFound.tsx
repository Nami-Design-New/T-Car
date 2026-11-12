"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Illustration } from "@/shared/ui/Illustration";
import { Button } from "@/shared/ui/Button";

type Resource = "cars" | "cities" | "bookings";

export interface Props {
  resource: Resource;
  href: "/cars" | "/cities" | "/account/bookings";
}

/** Each resource sends the visitor to its own list with its own label. */
const BROWSE_KEY: Record<Resource, `notFound.browse${string}`> = {
  cars: "notFound.browseCars",
  cities: "notFound.browseCities",
  bookings: "notFound.browseBookings",
};

export function ResourceNotFound({ resource, href }: Props) {
  const t = useTranslations();

  return (
    <section className="py-20 max-md:py-12">
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="mx-auto flex max-w-[520px] flex-col items-center text-center">
          {/* Same scene as the cars list' empty state family: a search over the map. */}
          <Illustration
            name="resource"
            className="mb-2 w-[min(400px,90%)] max-md:w-[min(320px,90%)]"
          />

          <span className="bg-surface-card-primary text-action-primary mb-4 inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-bold">
            {t("notFound.error")}
          </span>
          <h1 className="text-text-primary mb-3 text-3xl font-extrabold max-md:text-2xl">
            {t("notFound.title")}
          </h1>
          <p className="text-text-subtle mb-8 text-base leading-[1.8]">
            {t(`errors.${resource}.notFound`)}
          </p>
          <Button asChild>
            <Link href={href}>{t(BROWSE_KEY[resource])}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
