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
    <section className="section account-page">
      <div className="container-tcar">
        <div className="account-header">
          <BackButton className="account-back-button" />
          <h1 className="account-page-title">{t("title")}</h1>
        </div>
        <PointsSummaryCard summary={pointsSummary} />

        <div className="account-grid">
          <AccountNav />
          <div className="account-content">{children}</div>
        </div>
      </div>
    </section>
  );
}
