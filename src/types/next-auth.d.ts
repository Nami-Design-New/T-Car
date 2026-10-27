import type { DefaultSession } from 'next-auth';
import type { AuthUser, OnboardingStep } from '@/features/auth/model';

declare module 'next-auth' {
  interface User {
    phone: string;
    /** Backend token; copied into the JWT and never into the session. */
    accessToken: string;
    /** Always set by `authorize`; optional because Auth.js also types the session user as `User`. */
    onboardingStep?: OnboardingStep;
  }

  interface Session {
    user: AuthUser & { onboardingStep?: OnboardingStep } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
    user?: AuthUser;
    onboardingStep?: OnboardingStep;
  }
}
