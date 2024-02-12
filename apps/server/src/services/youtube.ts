import { container } from '@sapphire/framework';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

import { Env } from '../utils/env.js';

export namespace YouTubeService {
  export const oauth2client = new OAuth2Client({
    clientId: Env.GOOGLE_CLIENT_ID,
    clientSecret: Env.GOOGLE_CLIENT_SECRET,
  });
  const apiKey = Env.GOOGLE_API_KEY;

  export const getChannel = async (channelId: string) => {
    try {
      const youtubeApi = google.youtube({ version: 'v3', auth: apiKey });
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
      const youtubeApi = google.youtube({ version: 'v3', auth: apiKey });
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
      const youtubeApi = google.youtube({ version: 'v3', auth: apiKey });
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
