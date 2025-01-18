import { defaultLocale, supportedLocales } from '@divine-bridge/i18n';
import acceptLanguage from 'accept-language';
import { NextMiddleware, NextResponse } from 'next/server';

import { auth } from './auth';
import { publicEnv } from './libs/common/public-env';

const protectedPaths = ['/dashboard'];

acceptLanguage.languages([...supportedLocales]);

export const middleware: NextMiddleware = async (request) => {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
  if (pathnameHasLocale) return;

  const session = await auth();
  if (session === null && protectedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(publicEnv.NEXT_PUBLIC_WEB_URL);
  }

  const locale =
    acceptLanguage.get(session?.user.locale) ??
    acceptLanguage.get(request.headers.get('Accept-Language')) ??
    defaultLocale;

  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
};

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!api|static|.*\\..*|_next).*)',
  ],
};
