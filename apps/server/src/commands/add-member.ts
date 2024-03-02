import {
  AppEventLogService,
  Database,
  Embeds,
  MembershipCollection,
  MembershipService,
} from '@divine-bridge/common';
import { t } from '@divine-bridge/i18n';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  RepliableInteraction,
  SlashCommandBuilder,
} from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { logger } from '../utils/logger.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export class AddMemberCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('add_member_command.name')
    .setI18nDescription('add_member_command.description')
    .addUserOption((option) =>
      option
        .setI18nName('add_member_command.member_option_name')
        .setI18nDescription('add_member_command.member_option_description')
        .setRequired(true),
    )
    .addRoleOption((option) =>
      option
        .setI18nName('add_member_command.role_option_name')
        .setI18nDescription('add_member_command.role_option_description')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setI18nName('add_member_command.end_date_option_name')
        .setI18nDescription('add_member_command.end_date_option_description'),
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

    // Get log channel and membership role, check if the role is manageable
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

    // Get the membership end date
    const currentDate = dayjs.utc().startOf('date');
    let endDate: dayjs.Dayjs;
    const end_date = options.getString('end_date');
    if (end_date !== null) {
      endDate = dayjs.utc(end_date, 'YYYY-MM-DD', true);
      if (!endDate.isValid()) {
        return await interaction.editReply({
          content: `${author_t('server.The end date')} \`${end_date}\` ${author_t('server.is not a valid date in YYYY-MM-DD format')}`,
        });
      }
      endDate = endDate.startOf('date');
    } else {
      endDate = currentDate.add(1, 'day').startOf('date');
    }

    // Check if the end date is too far in the future
    const validDateResult = Validators.isValidDateInterval(author_t, endDate, currentDate);
    if (!validDateResult.success) {
      return await interaction.editReply({
        content: validDateResult.error,
      });
    }

    // Get guild member
    const user = options.getUser('member', true);
    const memberResult = await discordBotApi.fetchGuildMember(guild.id, user.id);
    if (!memberResult.success) {
      return await interaction.editReply({
        content: `${author_t('server.The user')} <@${user.id}> ${author_t('server.is not a member of this server')}`,
      });
    }

    // Upsert user
    const userDoc = await Database.upsertUser(Utils.convertUser(user));
    const userLocale = userDoc.preference.locale;

    // Check if the user already has membership
    const oldMembershipDoc = await MembershipCollection.findOne({
      user: user.id,
      membershipRole: role.id,
    });
    let activeInteraction: RepliableInteraction = interaction;
    if (oldMembershipDoc !== null) {
      const confirmResult = await Utils.awaitUserConfirm(
        author_t,
        activeInteraction,
        'add-member-existing-membership',
        {
          content: `${author_t('server.The user')} <@${user.id}> ${author_t('server.already has an existing membership Do you want to overwrite it')}`,
          embeds: [Embeds.membership(author_t, Utils.convertUser(user), oldMembershipDoc)],
        },
      );
      if (!confirmResult.confirmed) return;
      activeInteraction = confirmResult.interaction;
      await activeInteraction.deferReply({ ephemeral: true });
    }

    // Ask for confirmation
    const confirmResult = await Utils.awaitUserConfirm(author_t, activeInteraction, 'add-member', {
      content:
        `${author_t('server.Are you sure you want to assign the membership role')} <@&${role.id}> ${author_t('server.to')} <@${user.id}>?\n` +
        `${author_t('server.Their membership will expire on')} \`${endDate.format('YYYY-MM-DD')}\``,
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

    // Add membership to user
    const addMembershipResult = await membershipService.add({
      userLocale,
      guildLocale,
      guildId: guild.id,
      guildName: guild.name,
      membershipRoleDoc,
      userPayload: Utils.convertUser(user),
      type: 'manual',
      begin: currentDate,
      end: endDate,
      moderatorId: moderator.id,
    });
    if (!addMembershipResult.success) {
      return await confirmedInteraction.editReply({
        content: addMembershipResult.error,
      });
    }

    await confirmedInteraction.editReply({
      content: `${author_t('server.Successfully assigned the membership role')} <@&${role.id}> ${author_t('server.to')} <@${
        user.id
      }>\n${author_t('server.Their membership will expire on')} \`${endDate.format('YYYY-MM-DD')}\``,
    });
  }
}
