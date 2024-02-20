'use server';

import { z } from 'zod';

import { authAction } from '.';
import type { RevokeYouTubeActionData } from '../../../types/server-actions';
import { cryptoUtils } from '../crypto';
import { googleOAuth } from '../google';

const revokeYouTubeActionInputSchema = z.object({});

export const revokeYouTubeAction = authAction<
  typeof revokeYouTubeActionInputSchema,
  RevokeYouTubeActionData
>(revokeYouTubeActionInputSchema, async (_input, { userDoc }) => {
  // Check if user has connected their YouTube account
  if (userDoc.youtube === null) {
    throw new Error('You have not connected your YouTube account');
  }
  const refreshToken = cryptoUtils.decrypt(userDoc.youtube.refreshToken);
  if (refreshToken === null) {
    console.error(`Failed to decrypt YouTube refresh token for user <@${userDoc._id}>`);
    throw new Error('Internal server error. Please contact the bot owner to fix this issue.');
  }

  // Revoke YouTube refresh token
  // ? We don't do error handling here and proceed to remove the user's YouTube account from DB
  if (refreshToken !== null) {
    await googleOAuth.revokeRefreshToken(refreshToken);
  }
  userDoc.youtube = null;
  await userDoc.save();

  return {};
});
