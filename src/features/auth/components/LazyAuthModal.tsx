'use client';

import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });

interface Props {
  show: boolean;
  onHide: () => void;
  next?: string;
}

/** Keeps the Bootstrap dialog and phone-input bundle out of the initial shell. */
export default function LazyAuthModal(props: Props) {
  return <AuthModal {...props} />;
}
