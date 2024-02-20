import { OAuth2Client } from 'google-auth-library';

import { GoogleUtils } from '../utils/google.js';

export class GoogleOAuth {
  public readonly oauth2Client: OAuth2Client;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    this.oauth2Client = new OAuth2Client({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
  }

  /**
   * This is useful when the OAuth2Client is used with different credentials.
   */
  public clone(): GoogleOAuth {
    return new GoogleOAuth(this.clientId, this.clientSecret);
  }

  public async getToken(
    code: string,
    redirectUrl: string,
  ): Promise<{ success: true; refreshToken: string } | { success: false; error: string }> {
    try {
      const result = await this.oauth2Client.getToken({
        code,
        redirect_uri: redirectUrl,
      });
      const {
        tokens: { refresh_token },
      } = result;
      if (refresh_token === null || refresh_token === undefined) {
        return { success: false, error: 'Failed to get refresh token' };
      }
      return { success: true, refreshToken: refresh_token };
    } catch (error) {
      const { message } = GoogleUtils.parseError(error);
      return { success: false, error: message };
    }
  }

  public async revokeRefreshToken(
    refreshToken: string,
  ): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await this.oauth2Client.revokeToken(refreshToken);
      return { success: true };
    } catch (error) {
      const { message } = GoogleUtils.parseError(error);
      return { success: false, error: message };
    }
  }
}
