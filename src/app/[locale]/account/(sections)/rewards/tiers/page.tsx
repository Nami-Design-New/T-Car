import { AllTiersPage } from "@/features/rewards";
import { getRewardsSummary } from "@/features/rewards/queries";

export default async function AllTiersRoute() {
  return <AllTiersPage summary={await getRewardsSummary()} />;
}
