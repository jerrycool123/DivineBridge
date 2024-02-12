import { container } from '@sapphire/framework';
import { OAuth2Client } from 'google-auth-library';

import { Env } from '../utils/env.js';

export namespace GoogleService {
  export const apiKey = Env.GOOGLE_API_KEY;

  export const createOAuth2Client = () =>
    new OAuth2Client({
      clientId: Env.GOOGLE_CLIENT_ID,
      clientSecret: Env.GOOGLE_CLIENT_SECRET,
    });

  export const requestAccessToken = async (
    oauth2Client: OAuth2Client,
    code: string,
    redirectUrl: string,
  ): Promise<{ success: true; refreshToken: string } | { success: false; error: string }> => {
    let refreshToken: string | null | undefined = undefined;

    try {
      const result = await oauth2Client.getToken({
        code,
        redirect_uri: redirectUrl,
      });
      const {
        tokens: { refresh_token },
      } = result;
      refreshToken = refresh_token;
    } catch (error) {
      container.logger.error(error);
    }
    if (refreshToken === null || refreshToken === undefined) {
      return { success: false, error: 'Failed to get refresh token' };
    }

    return { success: true, refreshToken };
  };

  export const revokeRefreshToken = async (
    refreshToken: string,
  ): Promise<{ success: true } | { success: false; error: string }> => {
    try {
      const oauth2Client = createOAuth2Client();
      await oauth2Client.revokeToken(refreshToken);
    } catch (err) {
      container.logger.error(err);
      return { success: false, error: 'Failed to revoke refresh token' };
    }

    return { success: true };
  };
}
