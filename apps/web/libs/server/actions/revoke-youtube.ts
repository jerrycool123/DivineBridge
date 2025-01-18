'use server';

import { z } from 'zod';

import { authAction } from '.';
import type { RevokeYouTubeActionData } from '../../../types/server-actions';
import { cryptoUtils } from '../crypto';
import { googleOAuth } from '../google';
import { getServerTranslation } from '../i18n';
import { logger } from '../logger';

const revokeYouTubeActionInputSchema = z.object({});

export const revokeYouTubeAction = authAction
  .schema(revokeYouTubeActionInputSchema)
  .action<RevokeYouTubeActionData>(async ({ ctx: { session, userDoc } }) => {
    const { t } = await getServerTranslation(session.user.locale);

    // Check if user has connected their YouTube account
    if (userDoc.youtube === null) {
      throw new Error(t('web.You have not connected your YouTube account'));
    }
    const decryptResult = cryptoUtils.decrypt(userDoc.youtube.refreshToken);
    if (!decryptResult.success) {
      logger.error(`Failed to decrypt YouTube refresh token for user <@${userDoc._id}>`);
      throw new Error(
        t('web.Internal Server Error Please contact the bot owner to fix this issue'),
      );
    }
    const { plain: refreshToken } = decryptResult;

    // Revoke YouTube refresh token
    // ? We don't do error handling here and proceed to remove the user's YouTube account from DB
    await googleOAuth.revokeRefreshToken(refreshToken);

    userDoc.youtube = null;
    await userDoc.save();

    return {};
  });
