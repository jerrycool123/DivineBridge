import { MembershipCollection } from '@divine-bridge/common';
import { createObjectCsvStringifier } from 'csv-writer';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);

export class ViewMembersCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setName('view-members')
    .setDescription('View all members with a specific membership role in this server')
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

  public constructor(context: ChatInputCommand.Context) {
    super(context);
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    { guild }: ChatInputCommand.ExecuteContext,
  ) {
    const { options } = interaction;
    if (guild === null) return;

    await interaction.deferReply({ ephemeral: true });

    // Get membership role
    const role = options.getRole('role', true);
    const [membershipRoleResult] = await Promise.all([
      Validators.isGuildHasMembershipRole(guild.id, role.id),
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
