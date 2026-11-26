import { ReferralsPage } from "@/features/referrals";
import { getReferralProgram } from "@/features/referrals/queries";

export default async function ReferralsRoute() {
  const program = await getReferralProgram();
  return <ReferralsPage program={program} />;
}
