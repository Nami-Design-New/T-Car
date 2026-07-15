'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {FiLogOut, FiChevronDown } from 'react-icons/fi';
import { ImUser } from "react-icons/im";
import Image from 'next/image';

import accountIcon from '@assets/icons/account.svg';
import bookingIcon from '@assets/icons/booking.svg';
// import logoutIcon from '@assets/icons/logout.svg';
interface Props {
  avatarUrl?: string;
  onLogout: () => void;
}

export default function UserMenu({ avatarUrl, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="user-menu-avatar">
          {avatarUrl ? <Image src={avatarUrl} alt="avatar" fill sizes="32px" /> : <ImUser />}
        </span>

        <FiChevronDown className={`user-menu-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <ul className="user-menu-list" role="menu">
          <li role="menuitem">
            <Link href="/account" onClick={() => setOpen(false)}>
              <Image src={accountIcon} alt="" width={18} height={18} className="menu-icon" />
              <span>حسابي</span>
            </Link>
          </li>

          {/* <li role="menuitem">
            <Link href="/my-bookings" onClick={() => setOpen(false)}>
              <Image src={bookingIcon} alt="" width={18} height={18} className="menu-icon" />
              <span>حجوزاتي</span>
            </Link>
          </li> */}

          <li className="user-menu-divider" role="separator" />

          <li role="menuitem">
            <button
              type="button"
              className="logout_btn"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <FiLogOut /> تسجيل الخروج
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
