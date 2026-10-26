"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { NAV_LINKS } from "@/shared/config/site";

export default function HeaderNavLinks() {
  const t = useTranslations();
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);

    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);
    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, [pathname]);

  return (
    <ul className="flex flex-1 basis-auto items-center justify-center gap-5 [list-style:none] max-lg:w-full max-lg:flex-none max-lg:flex-col max-lg:items-start max-lg:justify-start max-lg:gap-2">
      {NAV_LINKS.map((link) => {
        const [, linkHash] = link.href.split("#");
        const isHomeLink = link.href === "/";
        const isActive =
          pathname === "/" && (isHomeLink ? !hash : hash === `#${linkHash}`);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive ? "location" : undefined}
              onClick={() => {
                const [, nextHash] = link.href.split("#");
                setHash(nextHash ? `#${nextHash}` : "");
              }}
              className={`relative font-semibold transition duration-300 hover:text-action-primary max-lg:flex max-lg:w-full max-lg:items-center max-lg:rounded-xl max-lg:px-4 max-lg:py-3.5 ${
                isActive
                  ? "text-action-primary max-lg:bg-surface-card-primary"
                  : "text-text-primary max-lg:hover:bg-surface-card-primary"
              }`}
            >
              {t(link.label)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
