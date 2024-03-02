import {
  AppEventLogService,
  Database,
  MembershipCollection,
  MembershipService,
} from '@divine-bridge/common';
import { t } from '@divine-bridge/i18n';
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
    .setI18nName('delete_member_command.name')
    .setI18nDescription('delete_member_command.description')
    .addUserOption((option) =>
      option
        .setI18nName('delete_member_command.member_option_name')
        .setI18nDescription('delete_member_command.member_option_description')
        .setRequired(true),
    )
    .addRoleOption((option) =>
      option
        .setI18nName('delete_member_command.role_option_name')
        .setI18nDescription('delete_member_command.role_option_description')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false);
  public readonly global = true;
  public readonly guildOnly = true;
  public readonly moderatorOnly = true;
  public readonly requiredClientPermissions = [PermissionFlagsBits.ManageRoles];

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { guild, guildLocale, guild_t, author_t }: ChatInputCommand.ExecuteContext,
  ) {
    const { user: moderator, options } = interaction;

    await interaction.deferReply({ ephemeral: true });

    // Get log channel and membership role, check if the role is manageable, and upsert guild
    const role = options.getRole('role', true);
    const [logChannelResult, membershipRoleResult, manageableResult] = await Promise.all([
      Validators.isGuildHasLogChannel(author_t, guild),
      Validators.isGuildHasMembershipRole(author_t, guild.id, role.id),
      Validators.isManageableRole(author_t, guild, role.id),
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
        content: `${author_t('server.The user')} <@${user.id}> ${author_t('server.does not have the membership role')} <@&${role.id}>`,
      });
    }

    // Upsert user
    const userDoc = await Database.upsertUser(Utils.convertUser(user));
    const userLocale = userDoc.preference.locale;

    // Ask for confirmation
    const confirmResult = await Utils.awaitUserConfirm(author_t, interaction, 'delete-member', {
      content:
        `${author_t('server.delete_member_confirm_1')} <@&${role.id}> ${author_t('server.delete_member_confirm_2')} <@${user.id}> ${author_t('server.delete_member_confirm_3')}\n` +
        author_t(
          'server.Please note that this does not block the user from applying for the membership again',
        ),
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ ephemeral: true });

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(
      guild_t,
      logger,
      discordBotApi,
      guild.id,
    ).init();
    const membershipService = new MembershipService(t, discordBotApi, appEventLogService);

    // Remove membership from user
    const removeMembershipResult = await membershipService.remove({
      userLocale,
      guildLocale,
      guildId: guild.id,
      membershipRoleDoc,
      membershipDoc,
      removeReason: t(
        'server.it has been manually removed from the server by a moderator',
        userLocale,
      ),
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
      return await confirmedInteraction.editReply({
        content:
          `${author_t('server.I cannot remove the membership role')} <@&${membershipRoleDoc._id}> ${author_t('server.from the user')} <@${user.id}> ${author_t('server.due to one of the following reasons')}\n` +
          `- ${author_t('server.The user has left the server')}\n` +
          `- ${author_t('server.The membership role has been removed from the server')}\n` +
          `- ${author_t('server.The bot does not have the permission to manage roles')}\n` +
          `- ${author_t('server.The bot is no longer in the server')}\n` +
          `- ${author_t('server.Other unknown bot error')}\n\n` +
          author_t(
            'server.If you believe this is an unexpected error please contact the bot owner to resolve this issue',
          ),
      });
    }

    await confirmedInteraction.editReply({
      content: `${author_t('server.delete_member_success_1')} <@&${role.id}> ${author_t('server.delete_member_success_2')} <@${user.id}> ${author_t('server.delete_member_success_3')}`,
    });
  }
}
