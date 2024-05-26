import {
  Database,
  Embeds,
  MembershipRoleCollection,
  YouTubeChannelCollection,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import dedent from 'dedent';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { Validators } from '../utils/validators.js';
import { youtubeApiKeyApi } from '../utils/youtube.js';
import { VerifyCommand } from './verify.js';

export class AddRoleCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('add_role_command.name')
    .setI18nDescription('add_role_command.description')
    .addRoleOption((option) =>
      option
        .setI18nName('add_role_command.role_option_name')
        .setI18nDescription('add_role_command.role_option_description')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setI18nName('add_role_command.id_option_name')
        .setI18nDescription('add_role_command.id_option_description')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setI18nName('add_role_command.alias_option_name')
        .setI18nDescription('add_role_command.alias_option_description')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false);
  public readonly devTeamOnly = false;
  public readonly guildOnly = true;
  public readonly moderatorOnly = true;

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { guild, author_t }: ChatInputCommand.ExecuteContext,
  ) {
    const { options, client } = interaction;

    await interaction.deferReply({ ephemeral: true });

    // Check if the role is manageable
    const role = options.getRole('role', true);
    const manageableResult = await Validators.isManageableRole(author_t, guild, role.id);
    if (!manageableResult.success) {
      return await interaction.editReply({
        content: manageableResult.error,
      });
    }

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
          content: dedent`
            ${author_t('server.Could not find a YouTube chanel or video for the ID')} \`${id}\`
            ${author_t('server.Please try again Here are some examples')}
            - ${author_t('server.youtube_channel_id_description_1')} <https://www.youtube.com/channel/UCZlDXzGoo7d44bwdNObFacg> ${author_t('server.youtube_channel_id_description_2')} \`UCZlDXzGoo7d44bwdNObFacg\`${author_t('server.youtube_channel_id_description_3')}
            - ${author_t('server.youtube_video_id_description_1')} <https://www.youtube.com/watch?v=Dji-ehIz5_k> ${author_t('server.youtube_video_id_description_2')} \`Dji-ehIz5_k\`.
          `,
        });
      }
      youtubeChannelId = videoResult.video.snippet.channelId;
    }

    // Get YouTube channel data
    let youtubeChannelData: {
      id: string;
      title: string;
      description: string;
      customUrl: string;
      thumbnail: string;
    };
    let youtubeChannelDoc = await YouTubeChannelCollection.findById(youtubeChannelId);
    if (youtubeChannelDoc !== null) {
      // Use the channel data from the database
      youtubeChannelData = {
        id: youtubeChannelDoc._id,
        title: youtubeChannelDoc.profile.title,
        description: youtubeChannelDoc.profile.description,
        customUrl: youtubeChannelDoc.profile.customUrl,
        thumbnail: youtubeChannelDoc.profile.thumbnail,
      };
    } else {
      // Get channel info from YouTube API
      const channelResult = await youtubeApiKeyApi.getChannel(youtubeChannelId);
      if (!channelResult.success) {
        return await interaction.editReply({
          content: `${author_t('server.Could not find a YouTube channel for the channel ID')} \`${youtubeChannelId}\``,
        });
      }
      const { channel: parsedChannel } = channelResult;
      youtubeChannelData = {
        id: parsedChannel.id,
        title: parsedChannel.snippet.title,
        description: parsedChannel.snippet.description,
        customUrl: parsedChannel.snippet.customUrl,
        thumbnail: parsedChannel.snippet.thumbnails.high.url,
      };
    }

    // Check if the alias is available
    const aliasCommandName = options.getString('alias', true);
    const aliasResult = await Validators.isAliasAvailable(author_t, guild, aliasCommandName);
    if (!aliasResult.success) {
      return await interaction.editReply({
        content: aliasResult.error,
      });
    }

    // Check if the role is already assigned to the channel
    const oldMembershipRoleDoc = await MembershipRoleCollection.findOne({
      guild: guild.id,
      $or: [{ _id: role.id }, { youtube: youtubeChannelData.id }],
    }).populate<{
      youtube: YouTubeChannelDoc | null;
    }>('youtube');
    if (oldMembershipRoleDoc !== null && oldMembershipRoleDoc.youtube !== null) {
      return await interaction.editReply({
        content: `${author_t('server.The membership role')} <@&${oldMembershipRoleDoc._id}> ${author_t('server.is already assigned to the YouTube channel')} \`${oldMembershipRoleDoc.youtube.profile.title}\``,
      });
    }

    // Ask for confirmation
    const confirmResult = await Utils.awaitUserConfirm(author_t, interaction, 'add-role', {
      content: dedent`
        ${author_t('server.Are you sure you want to add the membership role')} <@&${role.id}> ${author_t('server.for the YouTube channel')} \`${youtubeChannelData.title}\`?\
        ${author_t('server.Members in this server can use')} \`/${author_t('verify_command.name')}\` ${author_t('server.or')} \`/${aliasCommandName}\` ${author_t('server.to verify their YouTube membership')}
      `,
      embeds: [Embeds.youtubeChannel(author_t, youtubeChannelData)],
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ ephemeral: true });

    // If the YouTube channel is not in the database, add it
    if (youtubeChannelDoc === null) {
      // Fetch member only video IDs
      const itemsResult = await youtubeApiKeyApi.getMemberOnlyPlaylistItems(youtubeChannelData.id);
      const memberOnlyVideoIds = (itemsResult.success ? itemsResult.items : []).map(
        (item) => item.contentDetails.videoId,
      );
      if (memberOnlyVideoIds.length === 0) {
        return await confirmedInteraction.editReply({
          content: `${author_t('server.Could not find any member only videos for the YouTube channel')} \`${youtubeChannelData.title}\``,
        });
      }

      // Add YouTube channel to database
      youtubeChannelDoc = await Database.upsertYouTubeChannel(
        youtubeChannelData,
        memberOnlyVideoIds,
      );
    }

    // Create command alias in this guild
    const onFailToCreateAliasCommand = async () => {
      return await confirmedInteraction.editReply({
        content: `${author_t('server.Failed to create the command alias')} \`/${aliasCommandName}\` ${author_t('server.in this server Please try again later')}`,
      });
    };

    const verifyCommand = this.context.bot.chatInputCommandMap['verify'] ?? null;
    if (verifyCommand !== null && verifyCommand instanceof VerifyCommand === false) {
      return await onFailToCreateAliasCommand();
    }
    const aliasCommand = verifyCommand.commandFactory({
      alias: true,
      name: aliasCommandName,
      youtubeChannelTitle: youtubeChannelDoc.profile.title,
    });
    const createResult = await discordBotApi.createGuildApplicationCommand(
      client.user.id,
      guild.id,
      aliasCommand.toJSON(),
    );
    if (!createResult.success) {
      return await onFailToCreateAliasCommand();
    }
    const aliasCommandId = createResult.command.id;

    // Link the role to YouTube membership and save to DB
    const newMembershipRoleDoc = await MembershipRoleCollection.build({
      _id: role.id,
      profile: {
        name: role.name,
        color: role.color,
      },
      config: {
        aliasCommandId,
        aliasCommandName,
      },
      guild: guild.id,
      youtube: youtubeChannelDoc._id,
    });
    await confirmedInteraction.editReply({
      content: `${author_t('server.Successfully added the membership role')} <@&${newMembershipRoleDoc._id}> ${author_t('server.for the YouTube channel')} \`${youtubeChannelDoc.profile.title}\`.`,
    });
  }
}
