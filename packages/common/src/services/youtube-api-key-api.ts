import { google } from 'googleapis';

import { GoogleUtils } from '../utils/google.js';
import { YouTubeUtils } from '../utils/youtube.js';

export class YouTubeApiKeyAPI {
  constructor(private readonly apiKey: string) {}

  public async getChannel(channelId: string): Promise<
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
      const youtubeApi = google.youtube({ version: 'v3', auth: this.apiKey });
      const response = await youtubeApi.channels.list({ part: ['snippet'], id: [channelId] });
      const channel = response.data.items?.[0] ?? null;
      if (channel === null) {
        return { success: false, error: 'Channel not found' };
      }
      const parsedChannel = YouTubeUtils.channelWithSnippetSchema.safeParse(channel);
      if (!parsedChannel.success) {
        return { success: false, error: 'Invalid channel response' };
      }
      return { success: true, channel: parsedChannel.data };
    } catch (error) {
      const { message } = GoogleUtils.parseError(error);
      return { success: false, error: message };
    }
  }

  public async getVideo(videoId: string): Promise<
    | {
        success: true;
        video: YouTubeUtils.VideoWithSnippet;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const youtubeApi = google.youtube({ version: 'v3', auth: this.apiKey });
      const response = await youtubeApi.videos.list({ part: ['snippet'], id: [videoId] });
      const video = response.data.items?.[0] ?? null;
      if (video === null) {
        return { success: false, error: 'Video not found' };
      }
      const parsedVideo = YouTubeUtils.videoWithSnippetSchema.safeParse(video);
      if (!parsedVideo.success) {
        return { success: false, error: 'Invalid video response' };
      }
      return { success: true, video: parsedVideo.data };
    } catch (error) {
      const { message } = GoogleUtils.parseError(error);
      return { success: false, error: message };
    }
  }

  public async getMemberOnlyPlaylistItems(channelId: string): Promise<
    | {
        success: true;
        items: YouTubeUtils.PlaylistItemWithContentDetails[];
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const memberOnlyPlaylistId = 'UUMO' + channelId.slice(2);
      const youtubeApi = google.youtube({ version: 'v3', auth: this.apiKey });
      const response = await youtubeApi.playlistItems.list({
        part: ['contentDetails'],
        playlistId: memberOnlyPlaylistId,
        maxResults: 20,
      });
      const items = response.data.items ?? [];
      const parsedItems = YouTubeUtils.playlistItemWithContentDetailsSchema
        .array()
        .safeParse(items);
      if (!parsedItems.success) {
        return { success: false, error: 'Invalid playlist items response' };
      }
      return { success: true, items: parsedItems.data };
    } catch (error) {
      const { message } = GoogleUtils.parseError(error);
      return { success: false, error: message };
    }
  }
}
