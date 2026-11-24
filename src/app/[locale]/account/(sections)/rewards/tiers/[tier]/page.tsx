import { notFound } from "next/navigation";
import { TierDetailPage, isRewardTierId } from "@/features/rewards";
import { getRewardsSummary } from "@/features/rewards/queries";

interface Props {
  params: Promise<{ tier: string }>;
}

export default async function TierDetailRoute({ params }: Props) {
  const { tier } = await params;
  if (!isRewardTierId(tier)) notFound();
  const summary = await getRewardsSummary();
  if (!summary.tiers.some((entry) => entry.id === tier)) notFound();
  return <TierDetailPage summary={summary} tierId={tier} />;
}
