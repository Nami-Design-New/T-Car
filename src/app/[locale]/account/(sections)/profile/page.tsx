import { ProfileTab } from '@/features/account';
import { getProfile } from '@/features/account/queries';

export default async function ProfilePage() {
  const profile = await getProfile();
  return <ProfileTab profile={profile} />;
}
