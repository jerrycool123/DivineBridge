import { MembershipCollection } from '@divine-bridge/common';
import { Command } from '@sapphire/framework';
import { createObjectCsvStringifier } from 'csv-writer';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { AttachmentBuilder, PermissionFlagsBits } from 'discord.js';

import { Database } from '../utils/database.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);

export class ViewMembersCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, preconditions: ['GuildOnly'] });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('view-members')
        .setDescription('View all members with a specific membership role in this server')
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

    // Get all members with the membership role
    const membershipDocs = await MembershipCollection.find({
      membershipRole: membershipRoleDoc._id,
    }).sort({ end: 1 });

    const writer = createObjectCsvStringifier({
      header: [
        { id: 'member_id', title: 'Member ID' },
        { id: 'type', title: 'Type' },
        { id: 'begin_date', title: 'Begin Date' },
        { id: 'end_date', title: 'End Date' },
      ],
    });
    const csvData =
      writer.getHeaderString() +
      '\n' +
      writer.stringifyRecords(
        membershipDocs.map((membershipDoc) => ({
          member_id: membershipDoc.user,
          type: membershipDoc.type,
          begin_date: dayjs.utc(membershipDoc.begin).format('YYYY-MM-DD'),
          end_date: dayjs.utc(membershipDoc.end).format('YYYY-MM-DD'),
        })),
      );

    await interaction.editReply({
      content:
        `Here are the members with the <@&${membershipRoleDoc._id}> role in this server.\n` +
        `You can use \`/check-member\` to check a member's membership status.`,
      files: [
        new AttachmentBuilder(Buffer.from(csvData, 'utf-8'), {
          name: `${membershipRoleDoc.profile.name}_members.csv`,
        }),
      ],
    });
  }
}
