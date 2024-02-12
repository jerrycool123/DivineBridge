import { MembershipCollection } from '@divine-bridge/common';
import { Command } from '@sapphire/framework';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import { PermissionFlagsBits } from 'discord.js';

import { Embeds } from '../components/embeds.js';
import { MembershipService } from '../services/membership.js';
import { Database } from '../utils/database.js';
import { Fetchers } from '../utils/fetchers.js';
import { Utils } from '../utils/index.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export class DeleteMemberCommand extends Command {
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

    // Get membership role
    const role = options.getRole('role', true);
    const [membershipRoleResult] = await Promise.all([
      Validators.isGuildHasMembershipRole(guild.id, role.id),
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
    }
    const membershipRoleDoc = membershipRoleResult.data;

    const user = options.getUser('member', true);

    // Get the membership
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

    // Initialize membership service

    // Remove membership from user
    const removeMembershipResult = await MembershipService.removeMembership({
      guild,
      membershipRoleDoc,
      membershipDoc,
      removeReason: 'it has been manually removed from the server by a moderator',
    });
    if (!removeMembershipResult.success) {
      return await confirmedInteraction.editReply({
        content: removeMembershipResult.error,
      });
    }
    const { notified, roleRemoved } = removeMembershipResult;

    // Check if the role is successfully removed
    if (!roleRemoved) {
      return await confirmedInteraction.editReply(
        Utils.getRoleRemoveErrorPayload(membershipRoleDoc, user.id),
      );
    }

    // Send removal log
    const manualMembershipRemovalEmbed = Embeds.manualMembershipRemoval(
      user,
      role.id,
      moderator.id,
    );
    await Utils.sendEventLog({
      guildOwner,
      logChannel,
      payload: {
        content: notified
          ? ''
          : "**[NOTE]** Due to the user's __Privacy Settings__ of this server, **I cannot send DM to notify them.**\nYou might need to notify them yourself.",
        embeds: [manualMembershipRemovalEmbed],
      },
    });

    await confirmedInteraction.editReply({
      content: `Successfully removed the membership role <@&${role.id}> from <@${user.id}>.`,
    });
  }
}
