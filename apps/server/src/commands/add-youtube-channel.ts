import { YouTubeChannelCollection } from '@divine-bridge/common';
import { Command } from '@sapphire/framework';
import { z } from 'zod';

import { Embeds } from '../components/embeds.js';
import { YouTubeService } from '../services/youtube.js';
import { Database } from '../utils/database.js';
import { Utils } from '../utils/index.js';

export class AddYouTubeChannelCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, options);
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('add-youtube-channel')
        .setDescription("Add a YouTube channel to the bot's supported list")
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('YouTube channel ID (UCXXXX...) or video ID')
            .setRequired(true),
        ),
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const { options } = interaction;

    await interaction.deferReply({ ephemeral: true });

    // Search YouTube channel by ID via YouTube API
    let youtubeChannelId: string;
    const id = options.getString('id', true);
    if (id.startsWith('UC') && id.length === 24) {
      // Channel ID
      youtubeChannelId = id;
    } else {
      // Video ID
      const video = await YouTubeService.getVideo(id);
      const videoChannelId = video?.snippet?.channelId ?? null;
      if (videoChannelId === null) {
        return await interaction.editReply({
          content:
            `Could not find a YouTube video for the video ID: \`${id}\`. Please try again. Here are some examples:\n\n` +
            `The channel ID of <https://www.youtube.com/channel/UCZlDXzGoo7d44bwdNObFacg> is \`UCZlDXzGoo7d44bwdNObFacg\`. It must begins with 'UC...'. Currently we don't support custom channel ID search (e.g. \`@AmaneKanata\`). If you cannot find a valid channel ID, please provide a video ID instead.\n\n` +
            `The video ID of <https://www.youtube.com/watch?v=Dji-ehIz5_k> is \`Dji-ehIz5_k\`.`,
        });
      } else {
        youtubeChannelId = videoChannelId;
      }
    }

    // Check if the YouTube channel is already in the database
    const youtubeChannelDoc = await YouTubeChannelCollection.findById(youtubeChannelId);
    if (youtubeChannelDoc !== null) {
      return await interaction.editReply({
        content: `The YouTube channel \`${youtubeChannelDoc.profile.title}\` is already in the bot's supported list.`,
      });
    }

    // Get channel info from YouTube API
    const rawChannel = await YouTubeService.getChannel(youtubeChannelId);
    const channelSchema = z.object({
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
    const parsedChannel = channelSchema.safeParse(rawChannel);
    if (!parsedChannel.success) {
      return await interaction.editReply({
        content: `Could not find a YouTube channel for the channel ID: \`${youtubeChannelId}\`. Please try again.`,
      });
    }
    const youtubeChannel = {
      id: parsedChannel.data.id,
      title: parsedChannel.data.snippet.title,
      description: parsedChannel.data.snippet.description,
      customUrl: parsedChannel.data.snippet.customUrl,
      thumbnail: parsedChannel.data.snippet.thumbnails.high.url,
    };

    // Ask for confirmation
    const youTubeChannelEmbed = Embeds.youtubeChannel(youtubeChannel);
    const confirmResult = await Utils.awaitUserConfirm(interaction, 'add-yt-channel', {
      content:
        "Are you sure you want to add the following YouTube channel to the bot's supported list?",
      embeds: [youTubeChannelEmbed],
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ ephemeral: true });

    // Fetch member only video IDs
    const items = await YouTubeService.getMemberOnlyPlaylistItems(youtubeChannel.id);
    const memberOnlyVideoIds = items
      .map((item) => item.contentDetails?.videoId)
      .filter((videoId): videoId is string => typeof videoId === 'string');
    if (memberOnlyVideoIds.length === 0) {
      return await confirmedInteraction.editReply({
        content: `Could not find any member only videos for the YouTube channel: \`${youtubeChannel.title}\`. Please try again.`,
      });
    }

    // Add YouTube channel to database
    const youTubeChannelDoc = await Database.upsertYouTubeChannel(
      youtubeChannel,
      memberOnlyVideoIds,
    );

    await confirmedInteraction.editReply({
      content: `Successfully added the YouTube channel \`${youTubeChannelDoc.profile.title}\` to the bot's supported list.`,
    });
  }
}
