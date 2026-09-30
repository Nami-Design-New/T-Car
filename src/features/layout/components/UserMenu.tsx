'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiChevronDown, FiLogOut } from 'react-icons/fi';
import { ImUser } from 'react-icons/im';
import { Link } from '@/i18n/navigation';
import { Menu } from '@/shared/ui/Menu';

import accountIcon from '@assets/icons/account.svg';

interface Props {
  avatarUrl?: string;
  onLogout: () => void;
}

export default function UserMenu({ avatarUrl, onLogout }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="user-menu">
      <Menu.Root open={open} onOpenChange={setOpen}>
        <Menu.Trigger asChild>
          <button type="button" className="user-menu-trigger" aria-label="حسابي">
            <span className="user-menu-avatar">
              {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="32px" /> : <ImUser />}
            </span>

            <FiChevronDown
              aria-hidden="true"
              className={`user-menu-chevron ${open ? 'open' : ''}`}
            />
          </button>
        </Menu.Trigger>

        <Menu.Content>
          <Menu.Item asChild>
            <Link href="/account/profile">
              <Image src={accountIcon} alt="" width={18} height={18} className="menu-icon" />
              <span>حسابي</span>
            </Link>
          </Menu.Item>

          <Menu.Separator />

          <Menu.Item tone="danger" onSelect={onLogout}>
            <FiLogOut aria-hidden="true" /> تسجيل الخروج
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>
    </div>
  );
}
