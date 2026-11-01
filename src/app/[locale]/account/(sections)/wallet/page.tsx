import { WalletSection } from '@/features/wallet';
import { getWallet } from '@/features/wallet/queries';

export default async function WalletPage() {
  const wallet = await getWallet();
  return <WalletSection initialData={wallet} />;
}
