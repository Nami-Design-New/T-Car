import { getTranslations } from "next-intl/server";

import { NotificationBell } from "@/features/notifications";
import AuthControl from "./AuthControl";
import HeaderNavLinks from "./HeaderNavLinks";
import LanguageSwitcher from "./LanguageSwitcher";
import LocationPicker from "./LocationPicker";
import MobileNav from "./MobileNav";
import BrandLogo from "./BrandLogo";

interface Props {
  hasSession: boolean;
  signedIn: boolean;
  unreadCount: number;
}

export default async function Header({
  hasSession,
  signedIn,
  unreadCount,
}: Props) {
  const t = await getTranslations();
  return (
    <header className="bg-surface-background/95 sticky top-0 z-100 border-b border-black/5 shadow-[0_4px_20px_rgba(30,30,30,0.06)] backdrop-blur-md">
      <div className="header-inner mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-2">
        <div className="flex min-w-0 items-center gap-[clamp(12px,2vw,24px)]">
          <BrandLogo />
          <LocationPicker />
        </div>

        <MobileNav
          signedIn={signedIn}
          drawerChildren={
            <>
              <HeaderNavLinks />
              <div className="border-stroke-light mt-8 flex w-full items-center gap-3 border-t pt-6">
                <div className="min-w-0 flex-1 [&>div]:w-full">
                  <LanguageSwitcher />
                </div>
                <div className="min-w-0 flex-1">
                  <AuthControl
                    signedIn={signedIn}
                    loginLabel={t("nav.login")}
                    logoutOnly
                  />
                </div>
              </div>
            </>
          }
        >
          <HeaderNavLinks />
          <div className="max-lg:border-stroke-light flex items-center gap-3 max-lg:mt-8 max-lg:w-full max-lg:flex-col max-lg:items-stretch max-lg:border-t max-lg:pt-6">
            <div className="flex items-center gap-3 max-lg:w-full">
              <LanguageSwitcher />
            </div>
            <AuthControl signedIn={signedIn} loginLabel={t("nav.login")} />
          </div>
        </MobileNav>
        {hasSession && <NotificationBell initialUnreadCount={unreadCount} />}
      </div>
    </header>
  );
}
