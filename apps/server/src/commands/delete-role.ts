import {
  AppEventLogService,
  Database,
  MembershipCollection,
  MembershipService,
  UserDoc,
} from '@divine-bridge/common';
import { t } from '@divine-bridge/i18n';
import dedent from 'dedent';
import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { logger } from '../utils/logger.js';
import { Validators } from '../utils/validators.js';

export class DeleteRoleCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('delete_role_command.name')
    .setI18nDescription('delete_role_command.description')
    .addRoleOption((option) =>
      option
        .setI18nName('delete_role_command.role_option_name')
        .setI18nDescription('delete_role_command.role_option_description')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setContexts(InteractionContextType.Guild);
  public readonly devTeamOnly = false;
  public readonly guildOnly = true;
  public readonly moderatorOnly = true;
  public readonly requiredClientPermissions = [PermissionFlagsBits.ManageRoles];

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { guild, guildLocale, guild_t, author_t }: ChatInputCommand.ExecuteContext,
  ) {
    const { options, client } = interaction;

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    // Get log channel and membership role, check if the role is manageable, and upsert guild
    const role = options.getRole('role', true);
    const [logChannelResult, membershipRoleResult, manageableResult] = await Promise.all([
      Validators.isGuildHasLogChannel(author_t, guild),
      Validators.isGuildHasMembershipRole(author_t, guild.id, role.id),
      Validators.isManageableRole(author_t, guild, role.id),
      Database.upsertGuild(Utils.convertGuild(guild)),
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
    }).populate<{ user: UserDoc | null }>('user');

    // Ask for confirmation
    const confirmResult = await Utils.awaitUserConfirm(author_t, interaction, 'delete-role', {
      content: dedent`
        ${author_t('server.delete_role_confirm_1')} <@&${membershipRoleDoc._id}> ${author_t('server.delete_role_confirm_2')} \`${membershipRoleDoc.youtube.profile.title}\` ${author_t('server.delete_role_confirm_3')}
        ${author_t('server.delete_role_confirm_4')} ${membershipDocs.length} ${author_t('server.delete_role_confirm_5')}

        ${author_t(
          'server.Note that we wont delete the role in Discord Instead we just delete the membership role in the database and remove the role from registered members',
        )}
      `,
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ flags: [MessageFlags.Ephemeral] });

    // Remove command alias in this guild
    const deleteResult = await discordBotApi.deleteGuildApplicationCommand(
      client.user.id,
      guild.id,
      membershipRoleDoc.config.aliasCommandId,
    );
    if (!deleteResult.success) {
      // ? We do not want to stop the process if the command alias deletion failed
      this.context.logger.error(deleteResult.error);
    }

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(
      guild_t,
      logger,
      discordBotApi,
      guild.id,
    ).init();
    const membershipService = new MembershipService(t, discordBotApi, appEventLogService);

    // Remove membership role from DB
    await membershipService.purgeRole({
      guildLocale,
      guildId: guild.id,
      membershipDocs,
      membershipRoleDoc,
      removeReason: `${guild_t('server.the membership role has been deleted by a moderator in the server')} \`${guild.name}\``,
    });

    await confirmedInteraction.editReply({
      content: `${author_t('server.delete_role_success_1')} <@&${role.id}> ${author_t('server.delete_role_success_2')} \`${membershipRoleDoc.youtube.profile.title}\` ${author_t('server.delete_role_success_3')}`,
    });
  }
}
