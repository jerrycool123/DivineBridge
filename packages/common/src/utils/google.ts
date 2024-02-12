import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { z } from 'zod';

export class GoogleAPI {
  private readonly oauth2Client: OAuth2Client;

  constructor(clientId: string, clientSecret: string) {
    this.oauth2Client = new OAuth2Client({
      clientId,
      clientSecret,
    });
  }

  // Ref1: https://github.com/member-gentei/member-gentei/blob/main/gentei/membership/membership.go'
  // Ref2: https://github.com/konnokai/Discord-Stream-Notify-Bot/blob/master/Discord%20Stream%20Notify%20Bot/SharedService/YoutubeMember/CheckMemberShip.cs
  public async verifyYouTubeMembership(
    refreshToken: string,
    videoId: string,
  ): Promise<
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
          | 'unknown_error';
      }
  > {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    const youtubeApi = google.youtube({ version: 'v3', auth: this.oauth2Client });
    try {
      await youtubeApi.commentThreads.list({
        part: ['id'],
        videoId,
        maxResults: 1,
      });
      return { success: true };
    } catch (error) {
      const errorSchema = z.object({
        errors: z
          .array(
            z.object({
              reason: z.string(),
            }),
          )
          .min(1),
      });
      const parsedError = errorSchema.safeParse(error);
      if (parsedError.success === true) {
        const { reason } = parsedError.data.errors[0];
        if (reason === 'forbidden') {
          return {
            success: false,
            error: 'forbidden',
          };
        } else if (reason === 'commentsDisabled') {
          console.error(error);
          return {
            success: false,
            error: 'comment_disabled',
          };
        } else if (reason === 'videoNotFound') {
          console.error(error);
          return {
            success: false,
            error: 'video_not_found',
          };
        }
      } else if (error instanceof GaxiosError && error.response !== undefined) {
        const errorResponseSchema = z.object({
          data: z.object({
            error_description: z.string(),
          }),
        });
        const parsedErrorResponse = errorResponseSchema.safeParse(error.response);
        if (
          parsedErrorResponse.success === true &&
          parsedErrorResponse.data.data.error_description
            .toLowerCase()
            .includes('token has been expired or revoked')
        ) {
          return {
            success: false,
            error: 'token_expired_or_revoked',
          };
        }
      }
      console.error(error);
    }
    return {
      success: false,
      error: 'unknown_error',
    };
  }
}
