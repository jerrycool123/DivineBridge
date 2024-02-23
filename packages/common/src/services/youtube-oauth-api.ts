import { google } from 'googleapis';

import { Logger } from '../services/system-log.js';
import { GoogleUtils } from '../utils/google.js';
import { YouTubeUtils } from '../utils/youtube.js';
import { GoogleOAuth } from './google-oauth.js';

export class YouTubeOAuthAPI {
  private readonly googleOAuth: GoogleOAuth;

  constructor(
    private readonly logger: Logger,
    googleOAuth: GoogleOAuth,
    refreshToken: string,
  ) {
    // ? Prevent polluting the original GoogleOAuth instance
    this.googleOAuth = googleOAuth.clone();
    this.googleOAuth.oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  public async getSelfChannel(): Promise<
    | {
        success: true;
        channel: YouTubeUtils.ChannelWithSnippet;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const youtubeApi = google.youtube({ version: 'v3', auth: this.googleOAuth.oauth2Client });
      const response = await youtubeApi.channels.list({ part: ['snippet'], mine: true });
      const channel = response.data.items?.[0] ?? null;
      if (channel === null) {
        return { success: false, error: 'Channel not found' };
      }
      const parsedChannel = YouTubeUtils.channelWithSnippetSchema.safeParse(channel);
      if (!parsedChannel.success) {
        return { success: false, error: 'Invalid channel data' };
      }
      return { success: true, channel: parsedChannel.data };
    } catch (error) {
      const { message } = GoogleUtils.parseError(error);
      return { success: false, error: message };
    }
  }

  // Ref1: https://github.com/member-gentei/member-gentei/blob/main/gentei/membership/membership.go'
  // Ref2: https://github.com/konnokai/Discord-Stream-Notify-Bot/blob/master/Discord%20Stream%20Notify%20Bot/SharedService/YoutubeMember/CheckMemberShip.cs
  public async verifyMembership(videoId: string): Promise<
    | {
        success: true;
      }
    | {
        success: false;
        error:
          | 'token_expired_or_revoked'
          | 'forbidden'
          | 'comment_disabled'
          | 'video_not_found'
          | 'invalid_grant'
          | 'unknown_error';
      }
  > {
    const youtubeApi = google.youtube({ version: 'v3', auth: this.googleOAuth.oauth2Client });
    try {
      await youtubeApi.commentThreads.list({
        part: ['id'],
        videoId,
        maxResults: 1,
      });
      return { success: true };
    } catch (error) {
      const parsedYoutubeError = YouTubeUtils.apiErrorSchema.safeParse(error);
      if (parsedYoutubeError.success) {
        const { reason } = parsedYoutubeError.data.errors[0];
        if (reason === 'forbidden') {
          return {
            success: false,
            error: 'forbidden',
          };
        } else if (reason === 'commentsDisabled') {
          this.logger.debug(error);
          return {
            success: false,
            error: 'comment_disabled',
          };
        } else if (reason === 'videoNotFound') {
          this.logger.debug(error);
          return {
            success: false,
            error: 'video_not_found',
          };
        }
      }

      const parsedGoogleError = GoogleUtils.parseError(error);
      if (parsedGoogleError.success) {
        const { error, error_description } = parsedGoogleError;
        if (error === 'invalid_grant') {
          return {
            success: false,
            error: 'invalid_grant',
          };
        } else if (error_description.toLowerCase().includes('token has been expired or revoked')) {
          return {
            success: false,
            error: 'token_expired_or_revoked',
          };
        }
      }

      this.logger.error(error);
      return {
        success: false,
        error: 'unknown_error',
      };
    }
  }
}
