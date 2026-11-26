import { MyCardsPage, parseRewardCardFilter } from "@/features/rewards";
import { getRewardCards } from "@/features/rewards/queries";

interface Props {
  searchParams: Promise<{ filter?: string | string[] }>;
}

export default async function RewardCardsRoute({ searchParams }: Props) {
  const filter = parseRewardCardFilter((await searchParams).filter);
  return (
    <MyCardsPage
      key={filter}
      data={await getRewardCards(filter)}
      filter={filter}
    />
  );
}
