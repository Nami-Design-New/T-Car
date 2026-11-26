import { RewardsPage } from "@/features/rewards";
import { getRewardsHome } from "@/features/rewards/queries";

export default async function RewardsRoute() {
  const data = await getRewardsHome();
  return <RewardsPage data={data} />;
}
