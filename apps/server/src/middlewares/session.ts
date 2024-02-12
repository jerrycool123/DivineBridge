import { UserPayload } from '@divine-bridge/common';
import type { ApiRequest, ApiResponse } from '@sapphire/plugin-api';
import { Middleware } from '@sapphire/plugin-api';
import cookie from 'cookie';
import { z } from 'zod';

import { decode } from '../utils/authjs.js';
import { Env } from '../utils/env.js';

declare module '@sapphire/plugin-api' {
  interface ApiRequest {
    session?: UserPayload;
  }
}

export class PluginMiddleware extends Middleware {
  public constructor(context: Middleware.LoaderContext) {
    super(context, { position: 50 });
  }

  public override async run(request: ApiRequest, _response: ApiResponse) {
    const cookies = cookie.parse(request.headers['cookie'] ?? '');

    const cookieNames = ['__Secure-authjs.session-token', 'authjs.session-token'];
    let salt = '';
    let token: string | null = null;
    for (const cookieName of cookieNames) {
      if (cookieName in cookies) {
        salt = cookieName;
        token = cookies[cookieName];
        break;
      }
    }
    if (token === null) return;

    try {
      const payload = (await decode({ token, secret: Env.AUTH_SECRET, salt })) as unknown;
      const sessionSchema = z.object({
        user: z.object({
          id: z.string(),
          username: z.string(),
          image: z.string(),
        }),
      });
      const parsedPayload = sessionSchema.safeParse(payload);
      if (parsedPayload.success) {
        const { id, username, image } = parsedPayload.data.user;
        request.session = { id, username, image };
      }
    } catch (error) {
      // pass
    }
  }
}
