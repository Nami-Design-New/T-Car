import { accountSectionPath, isAccountTab } from '@/features/account';
import { redirect } from '@/i18n/navigation';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}

/** /account opens the profile; old /account?tab=<section> links still land on their section. */
export default async function AccountPage({ params, searchParams }: Props) {
  const [{ locale }, { tab }] = await Promise.all([params, searchParams]);
  redirect({ href: accountSectionPath(isAccountTab(tab) ? tab : 'profile'), locale });
}
