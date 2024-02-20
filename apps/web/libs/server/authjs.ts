import { decode } from '@auth/core/jwt';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import 'server-only';
import { z } from 'zod';

import { privateEnv } from './private-env';

const jwtSchema = z.object({
  access_token: z.string(),
});

export const getAccessTokenFromCookie = async (cookieStore: ReadonlyRequestCookies) => {
  const secureCookie = privateEnv.AUTH_URL.startsWith('https://');
  const cookieName = secureCookie ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const jwtCookie = cookieStore.get(cookieName);
  if (jwtCookie === undefined) {
    throw new Error('Unauthorized');
  }
  const jwt = await decode({
    token: jwtCookie.value,
    secret: privateEnv.AUTH_SECRET,
    salt: cookieName,
  });

  const jwtData = jwtSchema.safeParse(jwt);
  if (!jwtData.success) {
    throw new Error('Unauthorized');
  }
  return jwtData.data.access_token;
};
