import NextAuth, { CredentialsSignin } from 'next-auth';
import { decode } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import type { AuthGrant, OnboardingStep } from '@/features/auth/model';
import { authApi } from '@/features/auth/api';
import { AppError, toAppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { SECURE_SESSION_COOKIE, SESSION_COOKIE } from '@/shared/config/session';

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Self-hosted (not Vercel), so trust the Host header of the deployment.
  trustHost: true,
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: SECURE_SESSION_COOKIE },
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
        /** 'register' when a new customer finishes registration (mock until A6); sign-in otherwise. */
        intent: {},
        fullName: {},
        email: {},
        birthDate: {},
      },
      async authorize(credentials) {
        const countryCode = text(credentials.countryCode);
        const phone = text(credentials.phone);
        const code = text(credentials.code);

        let grant: AuthGrant;
        try {
          grant =
            credentials.intent === 'register'
              ? await authApi.register({
                  phone: `${countryCode}${phone}`,
                  code,
                  fullName: text(credentials.fullName),
                  email: text(credentials.email),
                  birthDate: text(credentials.birthDate),
                })
              : await authApi.verifyOtp({ countryCode, phone }, code);
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
    jwt({ token, user }) {
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
