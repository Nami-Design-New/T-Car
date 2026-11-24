import { RewardsPage } from "@/features/rewards";
import { getRewardsSummary } from "@/features/rewards/queries";

export default async function RewardsRoute() {
  const summary = await getRewardsSummary();
  return <RewardsPage summary={summary} />;
}
