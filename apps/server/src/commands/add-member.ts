import { MembershipCollection } from '@divine-bridge/common';
import { Command } from '@sapphire/framework';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import { PermissionFlagsBits, RepliableInteraction } from 'discord.js';

import { Embeds } from '../components/embeds.js';
import { MembershipService } from '../services/membership.js';
import { Database } from '../utils/database.js';
import { Fetchers } from '../utils/fetchers.js';
import { Utils } from '../utils/index.js';
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

    // Get guild owner and log channel
    const [guildOwner, logChannelResult] = await Promise.all([
      Fetchers.fetchGuildOwner(guild),
      Validators.isGuildHasLogChannel(guild),
    ]);
    if (guildOwner === null) {
      return await interaction.editReply({
        content: 'Failed to fetch the guild owner.',
      });
    } else if (!logChannelResult.success) {
      return await interaction.editReply({
        content: logChannelResult.error,
      });
    }
    const logChannel = logChannelResult.data;

    // Check if the guild has the membership role and the role is manageable
    const role = options.getRole('role', true);
    const [membershipRoleResult, manageableResult] = await Promise.all([
      Validators.isGuildHasMembershipRole(guild.id, role.id),
      Validators.isManageableRole(guild, role.id),
      Database.updateMembershipRole({
        id: role.id,
        name: role.name,
        color: role.color,
      }),
    ]);
    if (!membershipRoleResult.success) {
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

    // Upsert user
    const user = options.getUser('member', true);
    await Database.upsertUser({
      id: user.id,
      username: user.username,
      avatar: user.displayAvatarURL(),
    });

    // Get guild member
    const member = await Fetchers.fetchGuildMember(guild, user.id);
    if (member === null) {
      return await interaction.editReply({
        content: `The user <@${user.id}> is not a member of this server.`,
      });
    }

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
          embeds: [Embeds.membership(user, oldMembershipDoc)],
        },
      );
      if (!confirmResult.confirmed) return;
      activeInteraction = confirmResult.interaction;
      await activeInteraction.deferReply({ ephemeral: true });
    }

    // Ask for confirmation
    const confirmResult = await Utils.awaitUserConfirm(activeInteraction, 'add-member', {
      content:
        `Are you sure you want to assign the membership role <@&${role.id}> to <@${member.id}>?\n` +
        `Their membership will expire on \`${endDate.format('YYYY-MM-DD')}\`.`,
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ ephemeral: true });

    // Add membership to user
    const addMembershipResult = await MembershipService.addMembership({
      guild,
      membershipRoleDoc,
      member,
      type: 'manual',
      begin: currentDate,
      end: endDate,
    });
    if (!addMembershipResult.success) {
      return await confirmedInteraction.editReply({
        content: addMembershipResult.error,
      });
    }
    const { notified, updatedMembershipDoc } = addMembershipResult;

    // Send added log
    const manualMembershipAssignmentEmbed = Embeds.manualMembershipAssignment(
      member.user,
      updatedMembershipDoc.begin,
      updatedMembershipDoc.end,
      updatedMembershipDoc.membershipRole,
      moderator.id,
    );
    await Utils.sendEventLog({
      guildOwner,
      logChannel,
      payload: {
        content: notified
          ? ''
          : "**[NOTE]** Due to the user's __Privacy Settings__ of this server, **I cannot send DM to notify them.**\nYou might need to notify them yourself.",
        embeds: [manualMembershipAssignmentEmbed],
      },
    });

    await confirmedInteraction.editReply({
      content: `Successfully assigned the membership role <@&${role.id}> to <@${
        member.id
      }>.\nTheir membership will expire on \`${endDate.format('YYYY-MM-DD')}\`.`,
    });
  }
}
