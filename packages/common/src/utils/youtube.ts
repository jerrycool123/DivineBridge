import { z } from 'zod';

export namespace YouTubeUtils {
  export const apiErrorSchema = z.object({
    errors: z
      .array(
        z.object({
          reason: z.string(),
        }),
      )
      .min(1),
  });

  export const channelWithSnippetSchema = z.object({
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

  export type ChannelWithSnippet = z.infer<typeof channelWithSnippetSchema>;

  export const videoWithSnippetSchema = z.object({
    id: z.string(),
    snippet: z.object({
      channelId: z.string(),
    }),
  });

  export type VideoWithSnippet = z.infer<typeof videoWithSnippetSchema>;

  export const playlistItemWithContentDetailsSchema = z.object({
    contentDetails: z.object({
      videoId: z.string(),
    }),
  });

  export type PlaylistItemWithContentDetails = z.infer<typeof playlistItemWithContentDetailsSchema>;
}
