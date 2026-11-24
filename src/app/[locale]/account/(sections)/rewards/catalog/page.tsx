import { CatalogPage } from "@/features/rewards";
import { getRewardCatalog } from "@/features/rewards/queries";

export default async function RewardCatalogRoute() {
  return <CatalogPage data={await getRewardCatalog()} />;
}
