import { MyCardsPage } from "@/features/rewards";
import { getRewardCards } from "@/features/rewards/queries";

export default async function RewardCardsRoute() {
  return <MyCardsPage data={await getRewardCards()} />;
}
