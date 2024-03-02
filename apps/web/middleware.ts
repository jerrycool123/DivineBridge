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

  return match(languages, supportedLocales, defaultLocale);
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
