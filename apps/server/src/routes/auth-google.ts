import {
  GoogleAuthRequest,
  UserCollection,
  googleAuthRequestSchema,
  symmetricEncrypt,
} from '@divine-bridge/common';
import { type ApiRequest, type ApiResponse, Route, methods } from '@sapphire/plugin-api';
import { z } from 'zod';

import { GoogleService } from '../services/google.js';
import { YouTubeService } from '../services/youtube.js';
import { Env } from '../utils/env.js';

export class AuthGoogleRoute extends Route {
  public constructor(context: Route.LoaderContext, options: Route.Options) {
    super(context, { ...options, route: '/auth/google' });
  }

  public async [methods.POST](request: ApiRequest, response: ApiResponse) {
    const requestSchema = googleAuthRequestSchema.extend({ res: z.unknown() });
    const parsedRequest = requestSchema.safeParse(request);
    if (!parsedRequest.success) {
      return response.status(400).json({ message: parsedRequest.error });
    }
    const { body } = parsedRequest.data;
    const { code } = body;
    const { session } = request;
    if (session === undefined) {
      return response.status(401).json({ message: 'Unauthorized' });
    }

    const userDoc = await UserCollection.findById(session.id);
    if (userDoc === null) {
      return response.status(400).json({ message: 'User not found' });
    }

    // Get refresh token from authorization code
    const oauth2Client = GoogleService.createOAuth2Client();
    const result = await GoogleService.requestAccessToken(oauth2Client, code, 'postmessage');
    if (!result.success) {
      return response.status(400).json({ message: result.error });
    }
    const { refreshToken } = result;

    // Get channel info from YouTube API
    const rawChannel = await YouTubeService.getSelfChannel(refreshToken);
    const parsedChannel = YouTubeService.channelSchema.safeParse(rawChannel);
    if (!parsedChannel.success) {
      return response.status(400).json({
        message: 'Could not retrieve your YouTube channel information',
      });
    }
    const {
      id: youtubeChannelId,
      snippet: {
        title,
        customUrl,
        thumbnails: {
          high: { url: thumbnail },
        },
      },
    } = parsedChannel.data;

    // Check channel in database
    if (userDoc.youtube !== null && userDoc.youtube.id !== youtubeChannelId) {
      return response.status(400).json({
        message: 'You have already connected to a different YouTube channel',
      });
    } else {
      const otherUser = await UserCollection.findOne({
        '_id': { $ne: userDoc._id },
        'youtube.id': youtubeChannelId,
      });
      if (otherUser !== null) {
        return response.status(400).json({
          message: 'This YouTube channel has already been connected to another Discord account',
        });
      }
    }

    // Update user YouTube channel info
    const encryptedRefreshToken = symmetricEncrypt(refreshToken, Env.DATA_ENCRYPTION_KEY);
    if (encryptedRefreshToken === null) {
      // throw new InternalServerError('Could not encrypt refresh token');
      return response.status(500).json({ message: 'Internal Server Error' });
    }
    userDoc.youtube = {
      id: youtubeChannelId,
      title,
      customUrl,
      thumbnail,
      refreshToken: encryptedRefreshToken,
    };
    await userDoc.save();

    const resBody: GoogleAuthRequest['res'] = {
      id: userDoc.youtube.id,
      title: userDoc.youtube.title,
      customUrl: userDoc.youtube.customUrl,
      thumbnail: userDoc.youtube.thumbnail,
    };
    return response.status(201).json(resBody);
  }
}
