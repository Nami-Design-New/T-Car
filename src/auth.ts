import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {
  toOnboardingStep,
  type AuthGrant,
  type AuthUser,
  type OnboardingStep,
} from '@/features/auth/model';
import { sealGrant, unsealGrant } from '@/features/auth/sealed-grant';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/shared/config/session';

/** Salt of a grant sealed for sign-in; a grant sealed for anything else is refused. */
const SIGN_IN_GRANT = 'tcar.sign-in-grant';

/** What a session update may change after profile completion. */
type ProfileUpdate = Partial<Pick<AuthUser, 'name' | 'email' | 'phone'>> & { onboardingStep?: OnboardingStep };

/**
 * An update also reaches the `jwt` callback from the browser
 * (`POST /api/auth/session`). Only updates carrying this per-process value,
 * which never leaves the server, are applied (see `updateSessionProfile`).
 */
const SERVER_UPDATE = crypto.randomUUID();

interface SessionUpdate {
  serverUpdate?: string;
  user?: ProfileUpdate;
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  // Self-hosted (not Vercel), so trust the Host header of the deployment.
  trustHost: true,
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE,
      options: SESSION_COOKIE_OPTIONS,
    },
  },
  providers: [
    // The Server Actions verify the code (and finish registration) with the
    // API, then start the session here with the grant they got. The endpoint
    // is public, so it only takes a grant sealed by `signInWithGrant`.
    Credentials({
      id: 'grant',
      name: 'Verified grant',
      credentials: { grant: {} },
      async authorize(credentials) {
        const sealed = typeof credentials.grant === 'string' ? credentials.grant : '';
        const grant = await unsealGrant(sealed, SIGN_IN_GRANT);
        // Sessions start once the profile exists (registration finishes first).
        if (!grant || grant.onboardingStep === 'register') return null;

        return {
          ...grant.user,
          accessToken: grant.accessToken,
          onboardingStep: grant.onboardingStep,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (trigger === 'update') {
        const { serverUpdate, user: update } = (session ?? {}) as SessionUpdate;
        if (serverUpdate !== SERVER_UPDATE || !token.user) return token;
        if (typeof update?.name === 'string') token.user = { ...token.user, name: update.name };
        if (typeof update?.email === 'string') token.user = { ...token.user, email: update.email };
        if (typeof update?.phone === 'string') token.user = { ...token.user, phone: update.phone };
        if (typeof update?.onboardingStep === 'string') {
          token.onboardingStep = toOnboardingStep(update.onboardingStep, Boolean(token.user.name));
        }
        return token;
      }
      // A session started at verification, before sessions waited for the
      // profile: end it, and the customer signs in again to register.
      if (!user && token.onboardingStep === 'register') return null;
      if (user) {
        token.accessToken = user.accessToken;
        token.onboardingStep = user.onboardingStep;
        token.user = {
          id: user.id!,
          name: user.name ?? '',
          phone: user.phone,
          email: user.email ?? undefined,
        };
      }
      return token;
    },
    // The session is readable by the browser (/api/auth/session), so it gets
    // the user and the onboarding step only. The backend token stays in the
    // encrypted cookie.
    session({ session, token }) {
      return {
        ...session,
        user: { ...session.user, ...token.user, onboardingStep: token.onboardingStep },
      };
    },
  },
});

/**
 * Starts the session with a grant the API has just issued (verification of an
 * existing customer, or a finished registration). Server only.
 */
export async function signInWithGrant(grant: AuthGrant): Promise<void> {
  const sealed = await sealGrant(grant, SIGN_IN_GRANT, 60);
  await signIn('grant', { grant: sealed, redirect: false });
}

/**
 * Updates the signed-in session after a profile write (name, email, phone, and what
 * is left of onboarding). Server only: the marker keeps browser updates out.
 */
export async function updateSessionProfile(update: ProfileUpdate): Promise<void> {
  // Auth.js types the update as a Session; the marker is an extra field it passes through.
  const data = { serverUpdate: SERVER_UPDATE, user: update };
  await unstable_update(data as Parameters<typeof unstable_update>[0]);
}
