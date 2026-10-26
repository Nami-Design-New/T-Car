"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { SUPPORTED_LANGUAGES } from "@/shared/config/languages";
import { Menu } from "@/shared/ui/Menu";
import { cn } from "@/shared/lib/cn";
import Image from "next/image";
import { ICONS } from "@/shared/config/assets";
const langSwitchIcon = ICONS.langSwitchIcon;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations();
  const pathname = usePathname();

  const current =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === locale) ??
    SUPPORTED_LANGUAGES[0];

  const handleSelect = (code: string) => {
    if (code === locale) return;

    const segments = pathname.split("/");

    // Replace current locale in URL
    if (SUPPORTED_LANGUAGES.some((lang) => lang.code === segments[1])) {
      segments[1] = code;
    } else {
      segments.splice(1, 0, code);
    }

    // A full navigation rather than router.push. The Google Maps script is
    // injected once per page session and cannot be re-requested with a
    // different language, so a client-side switch would leave the map stuck
    // in the previous language. Reloading is what lets it load the new one.
    // Query string and hash are carried over; usePathname() omits both.
    window.location.assign(
      segments.join("/") + window.location.search + window.location.hash,
    );
  };

  return (
    <div className="relative min-w-15.5">
      <Menu.Root>
        <Menu.Trigger asChild>
          <button
            type="button"
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-surface-on-background px-3 text-sm font-semibold text-text-primary shadow-[inset_0px_8px_12px_0px_#FCFEFA,inset_0px_-4px_4px_0px_#0C0C0C26] transition hover:bg-surface-card-primary focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-2"
            aria-label={t("layout.languageSwitcher.label")}
          >
            <Image
              src={langSwitchIcon.src}
              width={langSwitchIcon.width}
              height={langSwitchIcon.height}
              aria-hidden="true"
              alt=""
              className="size-5 shrink-0 object-contain"
            />
            <span className=" text-xs font-extrabold tracking-[0.04em]">
              {current.code.toUpperCase()}
            </span>
            <FiChevronDown className=" shrink-0 text-sm" aria-hidden="true" />
          </button>
        </Menu.Trigger>

        <Menu.Content className=" min-w-30 z-[10002]!" align="end">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Menu.Item
              key={lang.code}
              className={cn(
                "justify-between",
                lang.code === locale &&
                  "text-action-primary data-highlighted:bg-surface-card-primary",
              )}
              onSelect={() => handleSelect(lang.code)}
            >
              <span>{lang.label}</span>
              {lang.code === locale && (
                <FiCheck className="text-action-primary" aria-hidden="true" />
              )}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Root>
    </div>
  );
}
