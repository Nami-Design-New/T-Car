"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { FiCalendar, FiHome, FiMoreHorizontal, FiUser } from "react-icons/fi";
import { Link, usePathname } from "@/i18n/navigation";
import { Dialog } from "@/shared/ui/Dialog";

interface Props {
  children: ReactNode;
  drawerChildren: ReactNode;
  signedIn: boolean;
}

export default function MobileNav({
  children,
  drawerChildren,
  signedIn,
}: Props) {
  const t = useTranslations("layout.mobileNav");
  const accountT = useTranslations("account.nav");
  const navT = useTranslations("nav");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isBookingsActive = pathname.startsWith("/account/bookings");
  const isAccountActive = pathname.startsWith("/account") && !isBookingsActive;

  useEffect(() => {
    setIsMounted(true);

    const desktop = window.matchMedia("(min-width: 992px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setIsOpen(false);
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const handleNavClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <nav
        aria-label={t("title")}
        className="header-nav hidden flex-1 items-center justify-between gap-8 lg:flex"
      >
        {children}
      </nav>

      {isMounted &&
        createPortal(
          <nav
            aria-label={t("bottomNavigation")}
            className={`fixed inset-x-0 bottom-0 z-100 grid ${signedIn ? "grid-cols-3" : "grid-cols-2"} items-stretch border-t border-stroke-light bg-surface-elevated/[0.96] px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(12,12,12,0.08)] backdrop-blur-xl lg:hidden`}
          >
            {signedIn ? (
              <>
                <Link
                  href="/account/profile"
                  aria-current={isAccountActive ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-2 ${isAccountActive ? "text-action-primary" : "text-text-subtle hover:bg-surface-card-primary hover:text-text-primary"}`}
                >
                  <FiUser className="size-5" aria-hidden="true" />
                  <span>{accountT("account")}</span>
                </Link>
                <Link
                  href="/account/bookings"
                  aria-current={isBookingsActive ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-2 ${isBookingsActive ? "text-action-primary" : "text-text-subtle hover:bg-surface-card-primary hover:text-text-primary"}`}
                >
                  <FiCalendar className="size-5" aria-hidden="true" />
                  <span>{accountT("bookings")}</span>
                </Link>
              </>
            ) : (
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-2 ${pathname === "/" ? "text-action-primary" : "text-text-subtle hover:bg-surface-card-primary hover:text-text-primary"}`}
              >
                <FiHome className="size-5" aria-hidden="true" />
                <span>{navT("home")}</span>
              </Link>
            )}
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              aria-label={t("more")}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border-0 bg-transparent text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-2 ${isOpen ? "text-action-primary" : "text-text-subtle hover:bg-surface-card-primary hover:text-text-primary"}`}
              onClick={() => setIsOpen(true)}
            >
              <FiMoreHorizontal className="size-5" aria-hidden="true" />
              <span>{t("more")}</span>
            </button>
          </nav>,
          document.body,
        )}

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="sm"
        label={t("title")}
        className="fixed! left-0! right-auto! top-0! m-0! h-dvh! max-h-none! w-[min(24rem,calc(100vw-2.5rem))]! max-w-none! translate-x-0! translate-y-0! gap-0! overflow-y-auto! rounded-none! bg-surface-elevated! p-6! pt-[calc(1.5rem+env(safe-area-inset-top))]! pb-[calc(1.5rem+env(safe-area-inset-bottom))]! shadow-[12px_0_36px_rgba(12,12,12,0.18)]! animate-[hero-drawer-slide-in-rtl_0.28s_cubic-bezier(0.22,1,0.36,1)]! rtl:left-auto! rtl:right-0! rtl:shadow-[-12px_0_36px_rgba(12,12,12,0.18)]! rtl:animate-[hero-drawer-slide-in_0.28s_cubic-bezier(0.22,1,0.36,1)]! motion-reduce:animate-none!"
      >
        <Dialog.Header className="mb-6 border-b border-stroke-light pb-4">
          <Dialog.Title>{t("title")}</Dialog.Title>
          <Dialog.Close className="size-11! rounded-lg! bg-surface-on-background! text-text-primary! shadow-[inset_0px_8px_12px_0px_#FCFEFA,inset_0px_-4px_4px_0px_#0C0C0C26]! hover:bg-surface-card-primary!" />
        </Dialog.Header>
        <nav
          aria-label={t("title")}
          className="flex flex-1 flex-col"
          onClick={handleNavClick}
        >
          {drawerChildren}
        </nav>
      </Dialog>
    </>
  );
}
