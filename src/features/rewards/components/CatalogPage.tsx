import { useTranslations } from "next-intl";
import { StateCard } from "@/shared/ui/StateCard";
import type { RewardCatalogData } from "../model";
import CatalogCard from "./CatalogCard";
import RedeemableBalanceCard from "./RedeemableBalanceCard";

interface Props {
  data: RewardCatalogData;
}

export default function CatalogPage({ data }: Props) {
  const t = useTranslations("rewards.catalog");

  return (
    <section className="bg-surface-card-primary flex flex-col gap-4 rounded-xl p-4 sm:p-5">
      <RedeemableBalanceCard balance={data.balance} showHistory />
      {data.items.length === 0 ? (
        <StateCard
          icon="gift"
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {data.items.map((item) => (
            <CatalogCard key={item.id} item={item} balance={data.balance} />
          ))}
        </div>
      )}
    </section>
  );
}
