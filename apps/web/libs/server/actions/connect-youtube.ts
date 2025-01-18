'use server';

import { UserCollection, YouTubeOAuthAPI } from '@divine-bridge/common';
import { z } from 'zod';

import { authAction } from '.';
import type { ConnectYouTubeActionData } from '../../../types/server-actions';
import { cryptoUtils } from '../crypto';
import { googleOAuth } from '../google';
import { getServerTranslation } from '../i18n';
import { logger } from '../logger';

const connectYouTubeActionInputSchema = z.object({
  code: z.string(),
});

export const connectYouTubeAction = authAction
  .schema(connectYouTubeActionInputSchema)
  .action<ConnectYouTubeActionData>(
    async ({ parsedInput: { code }, ctx: { session, userDoc } }) => {
      const { t } = await getServerTranslation(session.user.locale);

      // Get refresh token from authorization code
      const result = await googleOAuth.getToken(code, 'postmessage');
      if (!result.success) {
        throw new Error(result.error);
      }
      const { refreshToken } = result;

      // Get channel info from YouTube API
      const youtubeOAuthApi = new YouTubeOAuthAPI(logger, googleOAuth, refreshToken);
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
        throw new Error(t('web.You have already connected to a different YouTube account'));
      } else {
        const otherUser = await UserCollection.findOne({
          '_id': { $ne: userDoc._id },
          'youtube.id': youtubeChannelId,
        });
        if (otherUser !== null) {
          throw new Error(
            t('web.This YouTube account has already been connected to another Discord account'),
          );
        }
      }

      // Update user YouTube channel info
      const encryptResult = cryptoUtils.encrypt(refreshToken);
      if (!encryptResult.success) {
        logger.error(`Failed to encrypt YouTube refresh token for user <@${userDoc._id}>`);
        throw new Error(
          t('web.Internal Server Error Please contact the bot owner to fix this issue'),
        );
      }
      const { cipher: encryptedRefreshToken } = encryptResult;
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
    },
  );
