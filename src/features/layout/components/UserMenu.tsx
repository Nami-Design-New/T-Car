"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FiChevronDown } from "react-icons/fi";
import { ImUser } from "react-icons/im";
import { Link } from "@/i18n/navigation";
import { Menu } from "@/shared/ui/Menu";
import { cn } from "@/shared/lib/cn";

import { ICONS } from "@/shared/config/assets";
const accountIcon = ICONS.account;

interface Props {
  avatarUrl?: string;
  onLogout: () => void;
}

export default function UserMenu({ avatarUrl, onLogout }: Props) {
  const t = useTranslations("layout.userMenu");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-w-0">
      <Menu.Root open={open} onOpenChange={setOpen}>
        <Menu.Trigger asChild>
          <button
            type="button"
            className="border-stroke-light bg-surface-background hover:border-action-primary flex h-11 cursor-pointer items-center gap-2 rounded-md border px-2.5 pe-3.5 transition"
            aria-label={t("account")}
          >
            <span className="bg-surface-card-primary text-action-primary relative grid size-8.5 shrink-0 place-items-center overflow-hidden rounded-full text-[22px]">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill sizes="32px" />
              ) : (
                <ImUser />
              )}
            </span>

            <FiChevronDown
              aria-hidden="true"
              className={cn(
                "user-menu-chevron text-text-subtle shrink-0 text-sm transition duration-300",
                open && "open rotate-180",
              )}
            />
          </button>
        </Menu.Trigger>

        <Menu.Content className="w-50">
          <Menu.Item asChild>
            <Link href="/account/profile">
              <Image
                src={accountIcon}
                alt=""
                width={18}
                height={18}
                className="menu-icon"
              />
              <span>{t("account")}</span>
            </Link>
          </Menu.Item>

          <Menu.Separator />

          <Menu.Item tone="danger" onSelect={onLogout}>
            <Image src={ICONS.logout} alt="logout" width={16} height={16} />
            {t("logout")}
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>
    </div>
  );
}
