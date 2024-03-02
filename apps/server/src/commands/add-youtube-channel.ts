import { Database, Embeds, YouTubeChannelCollection } from '@divine-bridge/common';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Utils } from '../utils/index.js';
import { youtubeApiKeyApi } from '../utils/youtube.js';

export class AddYouTubeChannelCommand extends ChatInputCommand<false> {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('add_youtube_channel_command.name')
    .setI18nDescription('add_youtube_channel_command.description')
    .addStringOption((option) =>
      option
        .setI18nName('add_youtube_channel_command.id_option_name')
        .setI18nDescription('add_youtube_channel_command.id_option_description')
        .setRequired(true),
    );
  public readonly global = true;
  public readonly guildOnly = false;
  public readonly moderatorOnly = false;

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { author_t }: ChatInputCommand.ExecuteContext<false>,
  ) {
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
            `${author_t('server.Could not find a YouTube chanel or video for the ID')} \`${id}\`\n` +
            `${author_t('server.Please try again Here are some examples')}\n` +
            `- ${author_t('server.youtube_channel_id_description_1')} <https://www.youtube.com/channel/UCZlDXzGoo7d44bwdNObFacg> ${author_t('server.youtube_channel_id_description_2')} \`UCZlDXzGoo7d44bwdNObFacg\`${author_t('server.youtube_channel_id_description_3')}\n` +
            `- ${author_t('server.youtube_video_id_description_1')} <https://www.youtube.com/watch?v=Dji-ehIz5_k> ${author_t('server.youtube_video_id_description_2')} \`Dji-ehIz5_k\`.`,
        });
      }
      youtubeChannelId = videoResult.video.snippet.channelId;
    }

    // Check if the YouTube channel is already in the database
    const existingYoutubeChannelDoc = await YouTubeChannelCollection.findById(youtubeChannelId);
    if (existingYoutubeChannelDoc !== null) {
      return await interaction.editReply({
        content: `${author_t('server.The YouTube channel')} \`${existingYoutubeChannelDoc.profile.title}\` ${author_t('server.is already in the bots supported list')}`,
      });
    }

    // Get channel info from YouTube API
    const channelResult = await youtubeApiKeyApi.getChannel(youtubeChannelId);
    if (!channelResult.success) {
      return await interaction.editReply({
        content: `${author_t('server.Could not find a YouTube channel for the channel ID')} \`${youtubeChannelId}\``,
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
    const youtubeChannelEmbed = Embeds.youtubeChannel(author_t, youtubeChannel);
    const confirmResult = await Utils.awaitUserConfirm(author_t, interaction, 'add-yt-channel', {
      content: author_t(
        'server.Are you sure you want to add the following YouTube channel to the bots supported list',
      ),
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
        content: `${author_t('server.Could not find any member only videos for the YouTube channel')} \`${youtubeChannel.title}\``,
      });
    }

    // Add YouTube channel to database
    const youtubeChannelDoc = await Database.upsertYouTubeChannel(
      youtubeChannel,
      memberOnlyVideoIds,
    );

    await confirmedInteraction.editReply({
      content: `${author_t('server.Successfully added the YouTube channel')} \`${youtubeChannelDoc.profile.title}\` ${author_t('server.to the bots supported list')}`,
    });
  }
}
