import { notFound } from "next/navigation";
import { TierDetailPage } from "@/features/rewards";
import { getRewardTier, getRewardsSummary } from "@/features/rewards/queries";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TierDetailRoute({ params }: Props) {
  const { id } = await params;
  const tier = await getRewardTier(id);
  if (!tier) notFound();
  const summary = await getRewardsSummary();
  const tiers = summary.tiers.some((entry) => entry.id === id)
    ? summary.tiers.map((entry) => (entry.id === id ? tier : entry))
    : [...summary.tiers, tier];
  return <TierDetailPage summary={{ ...summary, tiers }} tierId={id} />;
}
