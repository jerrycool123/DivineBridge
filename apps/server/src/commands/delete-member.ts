import { AppEventLogService, MembershipCollection, MembershipService } from '@divine-bridge/common';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { logger } from '../utils/logger.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export class DeleteMemberCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setName('delete-member')
    .setDescription('Manually remove a YouTube membership role from a member in this server')
    .addUserOption((option) =>
      option
        .setName('member')
        .setDescription('The member to remove the role from')
        .setRequired(true),
    )
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

  public async execute(interaction: ChatInputCommandInteraction) {
    const { guild, user: moderator, options } = interaction;
    if (guild === null) return;

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

    // Get the membership
    const user = options.getUser('member', true);
    const membershipDoc = await MembershipCollection.findOne({
      user: user.id,
      membershipRole: role.id,
    });
    if (membershipDoc === null) {
      return await interaction.editReply({
        content: `The member <@${user.id}> does not have the membership role <@&${role.id}>.`,
      });
    }

    // Ask for confirmation
    const confirmResult = await Utils.awaitUserConfirm(interaction, 'delete-member', {
      content:
        `Are you sure you want to remove the membership role <@&${role.id}> from <@${user.id}>?\n` +
        'Please note that this does not block the user from applying for the membership again.',
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ ephemeral: true });

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(logger, discordBotApi, guild.id).init();
    const membershipService = new MembershipService(discordBotApi, appEventLogService);

    // Remove membership from user
    const removeMembershipResult = await membershipService.remove({
      guildId: guild.id,
      membershipRoleDoc,
      membershipDoc,
      removeReason: 'it has been manually removed from the server by a moderator',
      manual: true,
      userPayload: Utils.convertUser(user),
      moderatorId: moderator.id,
    });
    if (!removeMembershipResult.success) {
      return await confirmedInteraction.editReply({
        content: removeMembershipResult.error,
      });
    }
    const { roleRemoved } = removeMembershipResult;

    // Check if the role is successfully removed
    if (!roleRemoved) {
      return await confirmedInteraction.editReply(
        Utils.getRoleRemoveErrorPayload(membershipRoleDoc, user.id),
      );
    }

    await confirmedInteraction.editReply({
      content: `Successfully removed the membership role <@&${role.id}> from <@${user.id}>.`,
    });
  }
}
