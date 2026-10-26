import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { BackButton } from "@/shared/ui/BackButton";
import { PointsSummaryCard, type PointsSummary } from "@/features/points";
import AccountNav from "./AccountNav";

/** The account shell: title and section links stay while a section loads or fails. */
export default async function AccountLayout({
  children,
  pointsSummary,
}: {
  children: ReactNode;
  pointsSummary: PointsSummary;
}) {
  const t = await getTranslations("account");

  return (
    <section className="py-20 max-md:py-12">
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="mb-6 flex items-center gap-2.5">
          <BackButton />
          <h1 className="m-0">{t("title")}</h1>
        </div>
        <PointsSummaryCard summary={pointsSummary} />

        <div className="grid items-start gap-8 max-lg:grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
