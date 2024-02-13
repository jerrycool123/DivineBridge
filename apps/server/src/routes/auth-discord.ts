import {
  DiscordAuthRequest,
  discordAuthRequestSchema,
  symmetricDecrypt,
  symmetricEncrypt,
} from '@divine-bridge/common';
import { type ApiRequest, type ApiResponse, Route, methods } from '@sapphire/plugin-api';
import { z } from 'zod';

import { DiscordService } from '../services/discord.js';
import { Database } from '../utils/database.js';
import { Env } from '../utils/env.js';

export class AuthDiscordRoute extends Route {
  public constructor(context: Route.LoaderContext, options: Route.Options) {
    super(context, { ...options, route: '/auth/discord' });
  }

  public async [methods.POST](request: ApiRequest, response: ApiResponse) {
    const requestSchema = discordAuthRequestSchema.extend({ res: z.unknown() });
    const parsedRequest = requestSchema.safeParse(request);
    if (!parsedRequest.success) {
      return response.status(400).json({ message: parsedRequest.error });
    }
    const { body } = parsedRequest.data;

    // Decrypt Discord refresh token
    const refreshToken = symmetricDecrypt(body.token, Env.AUTH_SECRET);
    if (refreshToken === null) {
      return response.status(401).json({ message: 'Invalid token.' });
    }

    // Refresh access token
    const result = await DiscordService.getAccessToken(refreshToken);
    if (!result.success) {
      return response.status(401).json({ message: result.error });
    }
    const { accessToken, newRefreshToken } = result;

    // Get user info
    const currentUser = await DiscordService.getCurrentUser(accessToken);
    if (currentUser === null) {
      return response.status(401).json({ message: 'Failed to get user info.' });
    }

    // Encrypt Discord refresh token
    const encryptedRefreshToken = symmetricEncrypt(newRefreshToken, Env.DATA_ENCRYPTION_KEY);
    if (encryptedRefreshToken === null) {
      return response.status(500).json({ message: 'Internal server error.' });
    }

    // Upsert user info
    const userDoc = await Database.upsertUser({
      id: currentUser.id,
      username: currentUser.username,
      image: currentUser.avatar,
      refreshToken: encryptedRefreshToken,
    });

    const resBody: DiscordAuthRequest['res'] = {
      id: userDoc._id,
    };
    return response.status(201).json(resBody);
  }
}
