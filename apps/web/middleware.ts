import { defaultLocale, supportedLocales } from '@divine-bridge/i18n';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { headers } from 'next/headers';
import { NextMiddleware, NextResponse } from 'next/server';

import { auth } from './auth';
import { publicEnv } from './libs/common/public-env';

const protectedPaths = ['/dashboard'];

const getLocale = (headers: Negotiator.Headers) => {
  const languages = new Negotiator({ headers }).languages();

  try {
    // If the user's browser is set to use any language, we default to the defaultLocale
    if (languages.length === 1 && languages[0] === '*') {
      return defaultLocale;
    }

    return match(languages, supportedLocales, defaultLocale);
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

  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const authorized = await auth();
    if (authorized === null) {
      return NextResponse.redirect(publicEnv.NEXT_PUBLIC_WEB_URL);
    }
  }

  const requestHeaders = Object.fromEntries(headers().entries());
  const locale = getLocale(requestHeaders);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
};

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!api|static|.*\\..*|_next).*)',
  ],
};
