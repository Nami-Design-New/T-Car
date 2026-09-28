import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { AUTH_ERROR_CODES, type AuthGrant } from '@/features/auth/model';
import { authApi } from '@/services/auth.api';
import { toAppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { SECURE_SESSION_COOKIE, SESSION_COOKIE } from '@/shared/config/session';

/** Carries an AppError code to the client as `signIn(...).code`. */
class OtpSignInError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
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
        phone: {},
        code: {},
        // Present only when a new customer finishes registration.
        fullName: {},
        email: {},
        birthDate: {},
      },
      async authorize(credentials) {
        const phone = text(credentials.phone);
        const code = text(credentials.code);
        const fullName = text(credentials.fullName);

        let grant: AuthGrant;
        try {
          grant = fullName
            ? await authApi.register({
                phone,
                code,
                fullName,
                email: text(credentials.email),
                birthDate: text(credentials.birthDate),
              })
            : await authApi.verifyOtp(phone, code);
        } catch (error) {
          const appError = toAppError(error);
          // Expected outcomes (wrong code, new customer) are not reported;
          // reportError already skips validation errors.
          if (appError.code !== AUTH_ERROR_CODES.registrationRequired) {
            reportError(appError, { scope: 'auth.signIn' });
          }
          throw new OtpSignInError(appError.code ?? appError.kind);
        }

        return { ...grant.user, accessToken: grant.accessToken };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.user = { id: user.id!, name: user.name ?? '', phone: user.phone, email: user.email ?? undefined };
      }
      return token;
    },
    // The session is readable by the browser (/api/auth/session), so it gets
    // the user only. The backend token stays in the encrypted cookie.
    session({ session, token }) {
      return { ...session, user: { ...session.user, ...token.user } };
    },
  },
});
