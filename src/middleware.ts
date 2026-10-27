import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { auth } from './auth';
import { routing } from './i18n/routing';
import {
  NEXT_PATH_HEADER,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_EXPIRED,
  SESSION_PROOF_PARAM,
} from './shared/config/session';
import { isSessionProof } from './shared/lib/session-proof';

const intlMiddleware = createMiddleware(routing);

const LOCALE_PREFIX = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);

/**
 * Pages that need a signed-in customer, with or without a locale prefix.
 * (/my-bookings/[id] redirects to /account/bookings/[id] in next.config.mjs.)
 */
const PROTECTED = new RegExp(`^/(?:(${routing.locales.join('|')})/)?(?:account)(?:/|$)`);

/**
 * A fast redirect for signed-out visitors: they land on the home page with the
 * sign-in dialog open, and come back to the page afterwards. A session whose
 * profile is still missing (signed in at verification) gets the dialog on the
 * profile form instead. This only reads the session cookie; the backend still
 * has to check the token on every request.
 */
export default auth(async (req) => {
  const { pathname, search } = req.nextUrl;

  if (req.nextUrl.searchParams.get('auth') === SESSION_EXPIRED) return endSession(req);

  const match = pathname.match(PROTECTED);
  const profilePending = req.auth?.user?.onboardingStep === 'register';
  const next = (pathname.replace(LOCALE_PREFIX, '') || '/') + search;

  if (match && (!req.auth || profilePending)) {
    const locale = match[1] ?? routing.defaultLocale;
    const url = new URL(`/${locale}`, req.nextUrl);
    url.searchParams.set('auth', profilePending ? 'register' : 'login');
    url.searchParams.set('next', next);
    return NextResponse.redirect(url);
  }

  // Where to come back after signing in again, if a read finds the token dead
  // (services/http/session.ts). Set here, so a client cannot supply it.
  req.headers.set(NEXT_PATH_HEADER, next);
  return intlMiddleware(req);
});

/**
 * `?auth=expired&proof=…` (a page found the backend token dead): clears the
 * session cookie, which a page cannot do while it renders, and opens the
 * sign-in dialog. Only with a proof made for this session: a link anyone else
 * made loses its parameters and signs nobody out.
 */
async function endSession(req: NextRequest) {
  const url = req.nextUrl.clone();
  const proof = url.searchParams.get(SESSION_PROOF_PARAM);
  url.searchParams.delete(SESSION_PROOF_PARAM);

  const secret = process.env.AUTH_SECRET;
  const session = await getToken({ req, secret, cookieName: SESSION_COOKIE, salt: SESSION_COOKIE });
  if (session && !(await isSessionProof(proof, session.accessToken, secret))) {
    url.searchParams.delete('auth');
    url.searchParams.delete('next');
    return NextResponse.redirect(url);
  }

  url.searchParams.set('auth', 'login');
  const response = NextResponse.redirect(url);
  for (const { name } of req.cookies.getAll()) {
    if (name.startsWith(SESSION_COOKIE)) {
      response.cookies.set(name, '', { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
    }
  }
  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
