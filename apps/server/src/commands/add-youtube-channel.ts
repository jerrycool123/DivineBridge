import { Database, Embeds, YouTubeChannelCollection } from '@divine-bridge/common';
import { Command } from '@sapphire/framework';

import { Utils } from '../utils/index.js';
import { youtubeApiKeyApi } from '../utils/youtube.js';

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
      const videoResult = await youtubeApiKeyApi.getVideo(id);
      if (!videoResult.success) {
        return await interaction.editReply({
          content:
            `Could not find a YouTube video for the video ID: \`${id}\`. Please try again. Here are some examples:\n\n` +
            `The channel ID of <https://www.youtube.com/channel/UCZlDXzGoo7d44bwdNObFacg> is \`UCZlDXzGoo7d44bwdNObFacg\`. It must begins with 'UC...'. Currently we don't support custom channel ID search (e.g. \`@AmaneKanata\`). If you cannot find a valid channel ID, please provide a video ID instead.\n\n` +
            `The video ID of <https://www.youtube.com/watch?v=Dji-ehIz5_k> is \`Dji-ehIz5_k\`.`,
        });
      }
      youtubeChannelId = videoResult.video.snippet.channelId;
    }

    // Check if the YouTube channel is already in the database
    const existingYoutubeChannelDoc = await YouTubeChannelCollection.findById(youtubeChannelId);
    if (existingYoutubeChannelDoc !== null) {
      return await interaction.editReply({
        content: `The YouTube channel \`${existingYoutubeChannelDoc.profile.title}\` is already in the bot's supported list.`,
      });
    }

    // Get channel info from YouTube API
    const channelResult = await youtubeApiKeyApi.getChannel(youtubeChannelId);
    if (!channelResult.success) {
      return await interaction.editReply({
        content: `Could not find a YouTube channel for the channel ID: \`${youtubeChannelId}\`. Please try again.`,
      });
    }
    const { channel: parsedChannel } = channelResult;
    const youtubeChannel = {
      id: parsedChannel.id,
      title: parsedChannel.snippet.title,
      description: parsedChannel.snippet.description,
      customUrl: parsedChannel.snippet.customUrl,
      thumbnail: parsedChannel.snippet.thumbnails.high.url,
    };

    // Ask for confirmation
    const youtubeChannelEmbed = Embeds.youtubeChannel(youtubeChannel);
    const confirmResult = await Utils.awaitUserConfirm(interaction, 'add-yt-channel', {
      content:
        "Are you sure you want to add the following YouTube channel to the bot's supported list?",
      embeds: [youtubeChannelEmbed],
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ ephemeral: true });

    // Fetch member only video IDs
    const itemsResult = await youtubeApiKeyApi.getMemberOnlyPlaylistItems(youtubeChannel.id);
    const memberOnlyVideoIds = (itemsResult.success ? itemsResult.items : []).map(
      (item) => item.contentDetails.videoId,
    );
    if (memberOnlyVideoIds.length === 0) {
      return await confirmedInteraction.editReply({
        content: `Could not find any member only videos for the YouTube channel: \`${youtubeChannel.title}\`. Please try again.`,
      });
    }

    // Add YouTube channel to database
    const youtubeChannelDoc = await Database.upsertYouTubeChannel(
      youtubeChannel,
      memberOnlyVideoIds,
    );

    await confirmedInteraction.editReply({
      content: `Successfully added the YouTube channel \`${youtubeChannelDoc.profile.title}\` to the bot's supported list.`,
    });
  }
}
