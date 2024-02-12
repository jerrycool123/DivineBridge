import { container } from '@sapphire/framework';
import { google } from 'googleapis';
import { z } from 'zod';

import { GoogleService } from './google.js';

export namespace YouTubeService {
  export const channelSchema = z.object({
    id: z.string(),
    snippet: z.object({
      title: z.string(),
      description: z.string(),
      customUrl: z.string(),
      thumbnails: z.object({
        high: z.object({
          url: z.string(),
        }),
      }),
    }),
  });

  export const getSelfChannel = async (refreshToken: string) => {
    try {
      const oauth2Client = GoogleService.createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const youtubeApi = google.youtube({ version: 'v3', auth: oauth2Client });
      const response = await youtubeApi.channels.list({ part: ['snippet'], mine: true });
      const channel = response.data.items?.[0] ?? null;
      return channel;
    } catch (error) {
      container.logger.error(error);
    }
    return null;
  };

  export const getChannel = async (channelId: string) => {
    try {
      const youtubeApi = google.youtube({ version: 'v3', auth: GoogleService.apiKey });
      const response = await youtubeApi.channels.list({ part: ['snippet'], id: [channelId] });
      const channel = response.data.items?.[0] ?? null;
      return channel;
    } catch (error) {
      container.logger.error(error);
    }
    return null;
  };

  export const getVideo = async (videoId: string) => {
    try {
      const youtubeApi = google.youtube({ version: 'v3', auth: GoogleService.apiKey });
      const response = await youtubeApi.videos.list({ part: ['snippet'], id: [videoId] });
      const video = response.data.items?.[0] ?? null;
      return video;
    } catch (error) {
      container.logger.error(error);
    }
    return null;
  };

  export const getMemberOnlyPlaylistItems = async (channelId: string) => {
    try {
      const memberOnlyPlaylistId = 'UUMO' + channelId.slice(2);
      const youtubeApi = google.youtube({ version: 'v3', auth: GoogleService.apiKey });
      const response = await youtubeApi.playlistItems.list({
        part: ['contentDetails'],
        playlistId: memberOnlyPlaylistId,
        maxResults: 20,
      });
      const items = response.data.items ?? [];
      return items;
    } catch (error) {
      container.logger.error(error);
    }
    return [];
  };
}
