import { AppEventLogService, MembershipCollection, MembershipService } from '@divine-bridge/common';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { logger } from '../utils/logger.js';
import { Validators } from '../utils/validators.js';

export class DeleteRoleCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setName('delete-role')
    .setDescription('Delete a YouTube membership role in this server')
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('The YouTube Membership role in this server')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false);
  public readonly global = true;
  public readonly guildOnly = true;
  public readonly requiredClientPermissions = [PermissionFlagsBits.ManageRoles];

  public constructor(context: ChatInputCommand.Context) {
    super(context);
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    { guild }: ChatInputCommand.ExecuteContext,
  ) {
    const { options, client } = interaction;

    await interaction.deferReply({ ephemeral: true });

    // Get log channel and membership role, and check if the role is manageable
    const role = options.getRole('role', true);
    const [logChannelResult, membershipRoleResult, manageableResult] = await Promise.all([
      Validators.isGuildHasLogChannel(guild),
      Validators.isGuildHasMembershipRole(guild.id, role.id),
      Validators.isManageableRole(guild, role.id),
    ]);
    if (!logChannelResult.success) {
      return await interaction.editReply({
        content: logChannelResult.error,
      });
    } else if (!membershipRoleResult.success) {
      return await interaction.editReply({
        content: membershipRoleResult.error,
      });
    } else if (!manageableResult.success) {
      return await interaction.editReply({
        content: manageableResult.error,
      });
    }
    const membershipRoleDoc = membershipRoleResult.data;

    // Find members with the role in DB
    const membershipDocs = await MembershipCollection.find({
      membershipRole: membershipRoleDoc._id,
    });

    // Ask for confirmation
    const confirmResult = await Utils.awaitUserConfirm(interaction, 'delete-role', {
      content:
        `Are you sure you want to delete the membership role <@&${membershipRoleDoc._id}> for the YouTube channel \`${membershipRoleDoc.youtube.profile.title}\`?\n` +
        `This action will remove the membership role from ${membershipDocs.length} members.\n\n` +
        `Note that we won't delete the role in Discord. Instead, we just delete the membership role in the database, and remove the role from registered members.`,
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ ephemeral: true });

    // Remove command alias in this guild
    const deleteResult = await discordBotApi.deleteGuildApplicationCommand(
      client.user.id,
      guild.id,
      membershipRoleDoc.config.aliasCommandId,
    );
    if (!deleteResult.success) {
      // ? We do not want to stop the process if the command alias deletion failed
      this.bot.logger.error(deleteResult.error);
    }

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(logger, discordBotApi, guild.id).init();
    const membershipService = new MembershipService(discordBotApi, appEventLogService);

    // Remove membership role from DB
    await membershipService.purgeRole({
      guildId: guild.id,
      membershipDocs,
      membershipRoleDoc,
      removeReason: `the membership role has been deleted by a moderator in the server \`${guild.name}\``,
    });

    await confirmedInteraction.editReply({
      content: `Successfully deleted the membership role <@&${role.id}> for the YouTube channel \`${membershipRoleDoc.youtube.profile.title}\`.`,
    });
  }
}
