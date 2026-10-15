import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { auth } from './auth';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Pages that need a signed-in customer, with or without a locale prefix.
 * (/my-bookings/[id] redirects to /account/bookings/[id] in next.config.mjs.)
 */
const PROTECTED = new RegExp(`^/(?:(${routing.locales.join('|')})/)?(?:account)(?:/|$)`);

/**
 * A fast redirect for signed-out visitors: they land on the home page with the
 * sign-in dialog open, and come back to the page afterwards. This only reads the
 * session cookie; the backend still has to check the token on every request.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const match = pathname.match(PROTECTED);

  if (match && !req.auth) {
    const locale = match[1] ?? routing.defaultLocale;
    const next = (match[1] ? pathname.slice(locale.length + 1) : pathname) + search;
    const url = new URL(`/${locale}`, req.nextUrl);
    url.searchParams.set('auth', 'login');
    url.searchParams.set('next', next);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
});

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
