import { MembershipCollection } from '@divine-bridge/common';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

import { MembershipService } from '../services/membership.js';
import { Database } from '../utils/database.js';
import { Fetchers } from '../utils/fetchers.js';
import { Utils } from '../utils/index.js';
import { Validators } from '../utils/validators.js';

export class DeleteRoleCommand extends Command {
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
        .setName('delete-role')
        .setDescription('Delete a YouTube membership role in this server')
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
    const { guild, options } = interaction;
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

    // Notify admin about the removal
    const removeReason = `the membership role has been deleted by a moderator in the server \`${guild.name}\``;
    await Utils.sendEventLog({
      payload: {
        content:
          `The membership role <@&${membershipRoleDoc._id}> has been removed, since ${removeReason}.\n` +
          'I will try to remove the role from the members, but if I failed to do so, please remove the role manually.\n' +
          'If you believe this is an error, please contact the bot owner to resolve this issue.',
      },
      guildOwner,
      logChannel,
    });

    // Remove membership role from DB
    await MembershipService.purgeMembershipRole({
      guild,
      membershipDocs,
      membershipRoleDoc,
      removeReason: `the membership role has been deleted by a moderator in the server \`${guild.name}\``,
    });

    await confirmedInteraction.editReply({
      content: `Successfully deleted the membership role <@&${role.id}> for the YouTube channel \`${membershipRoleDoc.youtube.profile.title}\`.`,
    });
  }
}
