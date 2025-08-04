import { routing } from '@ferix/i18n/routing';
import { getSessionCookie } from 'better-auth/cookies';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// Define sign-in routes that should be accessible without authentication
const signInRoutes = ['/auth/sign-in', '/auth/sign-up'];

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: 'as-needed',
});

export default function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'ferix',
  });
  const { pathname } = request.nextUrl;

  const isSignInRoute = signInRoutes.some((route) => pathname.includes(route));
  const hasSession = Boolean(sessionCookie);

  const shouldRedirectToHome = isSignInRoute && hasSession;
  const shouldRedirectToSignIn = !(isSignInRoute || hasSession);

  // If user is on sign-in route and has a session, redirect to home
  if (shouldRedirectToHome) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not on sign-in route and has no session, redirect to sign-in
  if (shouldRedirectToSignIn) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  // biome-ignore lint/suspicious/noExplicitAny: adding this here to fix middleware types
  return intlMiddleware(request as any);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
