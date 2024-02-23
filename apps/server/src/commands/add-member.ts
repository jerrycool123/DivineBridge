import { AppEventLogService, Database, Embeds, MembershipCollection } from '@divine-bridge/common';
import { MembershipService } from '@divine-bridge/common';
import { Command } from '@sapphire/framework';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import { PermissionFlagsBits, RepliableInteraction } from 'discord.js';

import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { logger } from '../utils/logger.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export class AddMemberCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      preconditions: ['GuildOnly'],
      requiredClientPermissions: [PermissionFlagsBits.ManageRoles],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('add-member')
        .setDescription('Manually assign a YouTube membership role to a member in this server')
        .addUserOption((option) =>
          option
            .setName('member')
            .setDescription('The member to assign the role to')
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('The YouTube Membership role in this server')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('end_date')
            .setDescription(
              'The end date of the granted membership in YYYY-MM-DD, default to tomorrow',
            ),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
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

    // Get the membership end date
    const currentDate = dayjs.utc().startOf('date');
    let endDate: dayjs.Dayjs;
    const end_date = options.getString('end_date');
    if (end_date !== null) {
      endDate = dayjs.utc(end_date, 'YYYY-MM-DD', true);
      if (!endDate.isValid()) {
        return await interaction.editReply({
          content: `The end date \`${end_date}\` is not a valid date in YYYY-MM-DD format.`,
        });
      }
      endDate = endDate.startOf('date');
    } else {
      endDate = currentDate.add(1, 'day').startOf('date');
    }

    // Check if the end date is too far in the future
    const validDateResult = Validators.isValidDateInterval(endDate, currentDate);
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
        content: `The user <@${user.id}> is not a member of this server.`,
      });
    }

    // Upsert user
    await Database.upsertUser({
      id: user.id,
      username: user.username,
      image: user.displayAvatarURL(),
    });

    // Check if the user already has membership
    const oldMembershipDoc = await MembershipCollection.findOne({
      user: user.id,
      membershipRole: role.id,
    });
    let activeInteraction: RepliableInteraction = interaction;
    if (oldMembershipDoc !== null) {
      const confirmResult = await Utils.awaitUserConfirm(
        activeInteraction,
        'add-member-existing-membership',
        {
          content: `The user <@${user.id}> already has an existing membership. Do you want to overwrite it?`,
          embeds: [Embeds.membership(Utils.convertUser(user), oldMembershipDoc)],
        },
      );
      if (!confirmResult.confirmed) return;
      activeInteraction = confirmResult.interaction;
      await activeInteraction.deferReply({ ephemeral: true });
    }

    // Ask for confirmation
    const confirmResult = await Utils.awaitUserConfirm(activeInteraction, 'add-member', {
      content:
        `Are you sure you want to assign the membership role <@&${role.id}> to <@${user.id}>?\n` +
        `Their membership will expire on \`${endDate.format('YYYY-MM-DD')}\`.`,
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ ephemeral: true });

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(logger, discordBotApi, guild.id).init();
    const membershipService = new MembershipService(discordBotApi, appEventLogService);

    // Add membership to user
    const addMembershipResult = await membershipService.add({
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
      content: `Successfully assigned the membership role <@&${role.id}> to <@${
        user.id
      }>.\nTheir membership will expire on \`${endDate.format('YYYY-MM-DD')}\`.`,
    });
  }
}
