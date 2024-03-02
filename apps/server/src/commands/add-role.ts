import {
  MembershipRoleCollection,
  YouTubeChannelCollection,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { Validators } from '../utils/validators.js';
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
        .setI18nName('add_role_command.keyword_option_name')
        .setI18nDescription('add_role_command.keyword_option_description')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setI18nName('add_role_command.alias_option_name')
        .setI18nDescription('add_role_command.alias_option_description')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false);
  public readonly global = true;
  public readonly guildOnly = true;
  public readonly moderatorOnly = true;

  public override async autocomplete(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === 'keyword') {
      const keyword = focusedOption.value;
      const youtubeChannelDocs = await YouTubeChannelCollection.find({
        $or: [
          { _id: { $regex: keyword, $options: 'i' } },
          { 'profile.title': { $regex: keyword, $options: 'i' } },
          { 'profile.customUrl': { $regex: keyword, $options: 'i' } },
        ],
      }).limit(25);
      await interaction.respond(
        youtubeChannelDocs.map((channel) => ({
          name: `${channel.profile.title} (${channel.profile.customUrl})`,
          value: channel._id,
        })),
      );
    }
  }

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

    // Get YouTube channel by selected channel ID
    const keyword = options.getString('keyword', true);
    const youtubeChannelDoc = await YouTubeChannelCollection.findById(keyword);
    if (youtubeChannelDoc === null) {
      return await interaction.editReply({
        content: `${author_t('server.YouTube channel not found You can use the')} \`/${author_t('add_youtube_channel_command.name')}\` ${author_t('server.command to add a new channel to the bots supported list')}`,
      });
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
      $or: [{ _id: role.id }, { youtube: youtubeChannelDoc._id }],
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
      content:
        `${author_t('server.Are you sure you want to add the membership role')} <@&${role.id}> ${author_t('server.for the YouTube channel')} \`${youtubeChannelDoc.profile.title}\`?\n` +
        `${author_t('server.Members in this server can use')} \`/${author_t('verify_command.name')}\` ${author_t('server.or')} \`/${aliasCommandName}\` ${author_t('server.to verify their YouTube membership')}`,
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ ephemeral: true });

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
