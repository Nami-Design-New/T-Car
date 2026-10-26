import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import AuthControl from "./AuthControl";
import HeaderNavLinks from "./HeaderNavLinks";
import LanguageSwitcher from "./LanguageSwitcher";
import LocationPicker from "./LocationPicker";
import MobileNav from "./MobileNav";
import BrandLogo from "./BrandLogo";
import { ICONS } from "@/shared/config/assets";
const notificationIcon = ICONS.notification;

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
  const notificationCountLabel = t("account.notifications.unreadCount", {
    count: unreadCount,
  });

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
        {hasSession && (
          <Link
            href="/account/notifications"
            className="bg-surface-on-background text-text-primary hover:bg-surface-card-primary hover:text-action-primary focus-visible:outline-action-primary/20 relative ms-3 grid h-11 w-11 shrink-0 place-items-center rounded-lg shadow-[inset_0px_8px_12px_0px_#FCFEFA,inset_0px_-4px_4px_0px_#0C0C0C26] transition duration-300 focus-visible:outline-3 focus-visible:outline-offset-2"
            aria-label={`${t("account.notifications.title")}: ${notificationCountLabel}`}
          >
            <span className="relative inline-flex shrink-0">
              <Image
                src={notificationIcon.src}
                width={notificationIcon.width}
                height={notificationIcon.height}
                aria-hidden="true"
                alt={t("account.notifications.title")}
              />
              {unreadCount > 0 && (
                <span className="border-surface-background bg-status-error text-text-on-action absolute -inset-e-2 -top-2 grid h-6 w-max min-w-6 shrink-0 place-items-center rounded-full border-2 px-1.5 text-xs leading-none font-extrabold whitespace-nowrap">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
