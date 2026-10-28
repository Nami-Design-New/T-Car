'use client';

import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });

interface Props {
  show: boolean;
  onHide: () => void;
  next?: string;
  onRegistrationSuccess?: (locationNext: boolean) => void;
  onLocationRequired?: () => void;
}

/** Keeps the auth dialog and phone-input bundle out of the initial shell. */
export default function LazyAuthModal(props: Props) {
  return <AuthModal {...props} />;
}
