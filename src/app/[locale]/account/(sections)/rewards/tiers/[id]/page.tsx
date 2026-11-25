import { notFound } from "next/navigation";
import { TierDetailPage } from "@/features/rewards";
import { getRewardsSummary } from "@/features/rewards/queries";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TierDetailRoute({ params }: Props) {
  const { id } = await params;
  const summary = await getRewardsSummary();
  if (!summary.tiers.some((entry) => entry.id === id)) notFound();
  return <TierDetailPage summary={summary} tierId={id} />;
}
