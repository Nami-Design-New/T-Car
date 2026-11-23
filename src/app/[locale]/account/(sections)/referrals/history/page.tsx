import { ReferralHistoryPage } from "@/features/referrals";
import { getReferralHistory } from "@/features/referrals/queries";

export default async function ReferralHistoryRoute() {
  const history = await getReferralHistory();
  return <ReferralHistoryPage history={history} />;
}
