'use server';

import { UserCollection, YouTubeOAuthAPI } from '@divine-bridge/common';
import { z } from 'zod';

import { authAction } from '.';
import type { ConnectYouTubeActionData } from '../../../types/server-actions';
import { cryptoUtils } from '../crypto';
import { googleOAuth } from '../google';

const connectYouTubeActionInputSchema = z.object({
  code: z.string(),
});

export const connectYouTubeAction = authAction<
  typeof connectYouTubeActionInputSchema,
  ConnectYouTubeActionData
>(connectYouTubeActionInputSchema, async ({ code }, { userDoc }) => {
  // Get refresh token from authorization code
  const result = await googleOAuth.getToken(code, 'postmessage');
  if (!result.success) {
    throw new Error(result.error);
  }
  const { refreshToken } = result;

  // Get channel info from YouTube API
  const youtubeOAuthApi = new YouTubeOAuthAPI(googleOAuth, refreshToken);
  const channelResult = await youtubeOAuthApi.getSelfChannel();
  if (!channelResult.success) {
    throw new Error(channelResult.error);
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
  } = channelResult.channel;

  // Check channel in database
  if (userDoc.youtube !== null && userDoc.youtube.id !== youtubeChannelId) {
    throw new Error('You have already connected to a different YouTube channel');
  } else {
    const otherUser = await UserCollection.findOne({
      '_id': { $ne: userDoc._id },
      'youtube.id': youtubeChannelId,
    });
    if (otherUser !== null) {
      throw new Error('This YouTube channel has already been connected to another Discord account');
    }
  }

  // Update user YouTube channel info
  const encryptedRefreshToken = cryptoUtils.encrypt(refreshToken);
  if (encryptedRefreshToken === null) {
    throw new Error('Internal Server Error');
  }
  userDoc.youtube = {
    id: youtubeChannelId,
    title,
    customUrl,
    thumbnail,
    refreshToken: encryptedRefreshToken,
  };
  await userDoc.save();

  return {
    id: userDoc.youtube.id,
    title: userDoc.youtube.title,
    customUrl: userDoc.youtube.customUrl,
    thumbnail: userDoc.youtube.thumbnail,
  };
});
