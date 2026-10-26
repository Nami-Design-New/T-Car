"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/Button";

type Resource = "cars" | "cities" | "bookings";

export interface Props {
  resource: Resource;
  href: "/cars" | "/cities" | "/account/bookings";
}

export function ResourceNotFound({ resource, href }: Props) {
  const t = useTranslations();

  return (
    <section className="py-20 max-md:py-12">
      <div className="mx-auto w-full max-w-7xl px-2">
        <p className="bg-surface-card-primary text-action-primary mb-4 inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-bold">
          {t("notFound.error")}
        </p>
        <h1 className="text-text-primary mb-3 text-3xl font-extrabold">
          {t("notFound.title")}
        </h1>
        <p className="text-text-subtle mb-8 text-base leading-[1.8]">
          {t(`errors.${resource}.notFound`)}
        </p>
        <Button asChild>
          <Link href={href}>{t("notFound.browseCities")}</Link>
        </Button>
      </div>
    </section>
  );
}
