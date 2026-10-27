'use client';

import dynamic from 'next/dynamic';
import type { AuthFlowStart } from './useAuthFlow';

const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });

interface Props {
  show: boolean;
  onHide: () => void;
  next?: string;
  initialStep?: AuthFlowStart;
  onRegistrationSuccess?: (locationNext: boolean) => void;
  onLocationRequired?: () => void;
}

/** Keeps the auth dialog and phone-input bundle out of the initial shell. */
export default function LazyAuthModal(props: Props) {
  return <AuthModal {...props} />;
}
