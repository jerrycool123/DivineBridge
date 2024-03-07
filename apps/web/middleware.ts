import { defaultLocale, supportedLocales } from '@divine-bridge/i18n';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { Session } from 'next-auth';
import { headers } from 'next/headers';
import { NextMiddleware, NextResponse } from 'next/server';

import { auth } from './auth';
import { publicEnv } from './libs/common/public-env';

const protectedPaths = ['/dashboard'];

const getLocale = (session: Session | null, headers: Negotiator.Headers) => {
  try {
    // If the user has signed in, we use the user's locale
    if (session !== null && (supportedLocales as readonly string[]).includes(session.user.locale)) {
      return session.user.locale;
    }

    // If the user's browser is set to use any language, we default to the defaultLocale
    const headerLanguages = new Negotiator({ headers }).languages();
    if (headerLanguages.length === 1 && headerLanguages[0] === '*') {
      return defaultLocale;
    }

    return match(headerLanguages, supportedLocales, defaultLocale);
  } catch (error) {
    // If the language is not supported, we default to the defaultLocale
    return defaultLocale;
  }
};

export const middleware: NextMiddleware = async (request) => {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
  if (pathnameHasLocale) return;

  const authorized = await auth();
  if (authorized === null && protectedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(publicEnv.NEXT_PUBLIC_WEB_URL);
  }

  const requestHeaders = Object.fromEntries(headers().entries());
  const locale = getLocale(authorized, requestHeaders);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
};

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!api|static|.*\\..*|_next).*)',
  ],
};
