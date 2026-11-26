import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { BackButton } from "@/shared/ui/BackButton";
import type { VipSettings } from "@/features/settings";
import AccountNav from "./AccountNav";
import AccountPageTitle from "./AccountPageTitle";
import VipBanner from "./VipBanner";

/** The account shell: title and section links stay while a section loads or fails. */
export default async function AccountLayout({
  children,
  vip,
}: {
  children: ReactNode;
  vip: VipSettings;
}) {
  const t = await getTranslations("account");

  return (
    <section className="py-20 max-md:py-12">
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="mb-6 flex items-center gap-2.5">
          <BackButton />
          <AccountPageTitle fallback={t("title")} />
        </div>
        <VipBanner
          {...vip}
          title={t("vip.title")}
          description={
            vip.vipPackages
              ? t("vip.packageDescription", { package: vip.vipPackages })
              : t("vip.description")
          }
          contactLabel={t("vip.contactWhatsApp")}
        />
        <div className="grid items-start gap-8 max-lg:grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
