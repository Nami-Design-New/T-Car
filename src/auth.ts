import NextAuth, { CredentialsSignin } from 'next-auth';
import { decode } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import {
  toOnboardingStep,
  type AuthGrant,
  type AuthUser,
  type OnboardingStep,
} from '@/features/auth/model';
import { authApi } from '@/features/auth/api';
import { AppError, toAppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/shared/config/session';

/**
 * Carries the whole AppError (kind, backend message, field errors) to the
 * Server Action: with `redirect: false`, Auth.js rethrows this same instance.
 */
export class OtpSignInError extends CredentialsSignin {
  constructor(readonly error: AppError) {
    super();
    this.code = error.code ?? error.kind;
  }
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** What a session update may change after profile completion. */
type ProfileUpdate = Partial<Pick<AuthUser, 'name' | 'email'>> & { onboardingStep?: OnboardingStep };

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
    Credentials({
      id: 'otp',
      name: 'Phone',
      credentials: {
        /** The calling code and the normalized national number, as the API takes them. */
        countryCode: {},
        phone: {},
        code: {},
      },
      async authorize(credentials) {
        const countryCode = text(credentials.countryCode);
        const phone = text(credentials.phone);
        const code = text(credentials.code);

        let grant: AuthGrant;
        try {
          grant = await authApi.verifyOtp({ countryCode, phone }, code);
        } catch (error) {
          const appError = toAppError(error);
          // reportError skips expected outcomes (validation, e.g. a wrong code).
          reportError(appError, { scope: 'auth.signIn' });
          throw new OtpSignInError(appError);
        }

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
        if (typeof update?.onboardingStep === 'string') {
          token.onboardingStep = toOnboardingStep(update.onboardingStep, Boolean(token.user.name));
        }
        return token;
      }
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
 * The onboarding step of the session this request just created. `signIn`
 * writes the cookie into this request's cookie store, while `auth()` reads the
 * incoming request headers, so it would not see the new session yet.
 */
export async function readSignedInStep(): Promise<OnboardingStep | undefined> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!value || !secret) return undefined;
  const token = await decode({ token: value, secret, salt: SESSION_COOKIE });
  return token?.onboardingStep;
}

/**
 * Updates the signed-in session after a profile write (name, email, and what
 * is left of onboarding). Server only: the marker keeps browser updates out.
 */
export async function updateSessionProfile(update: ProfileUpdate): Promise<void> {
  // Auth.js types the update as a Session; the marker is an extra field it passes through.
  const data = { serverUpdate: SERVER_UPDATE, user: update };
  await unstable_update(data as Parameters<typeof unstable_update>[0]);
}
