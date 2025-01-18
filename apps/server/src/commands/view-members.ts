import { MembershipCollection } from '@divine-bridge/common';
import { createObjectCsvStringifier } from 'csv-writer';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import dedent from 'dedent';
import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);

export class ViewMembersCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('view_members_command.name')
    .setI18nDescription('view_members_command.description')
    .addRoleOption((option) =>
      option
        .setI18nName('view_members_command.role_option_name')
        .setI18nDescription('view_members_command.role_option_description')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setContexts(InteractionContextType.Guild);
  public readonly devTeamOnly = false;
  public readonly guildOnly = true;
  public readonly moderatorOnly = true;

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { guild, author_t }: ChatInputCommand.ExecuteContext,
  ) {
    const { options } = interaction;

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    // Get membership role
    const role = options.getRole('role', true);
    const membershipRoleResult = await Validators.isGuildHasMembershipRole(
      author_t,
      guild.id,
      role.id,
    );
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
    const csvData = dedent`
      ${writer.getHeaderString()}
      ${writer.stringifyRecords(
        membershipDocs.map((membershipDoc) => ({
          member_id: membershipDoc.user,
          type: membershipDoc.type,
          begin_date: dayjs.utc(membershipDoc.begin).format('YYYY-MM-DD'),
          end_date: dayjs.utc(membershipDoc.end).format('YYYY-MM-DD'),
        })),
      )}
    `;

    await interaction.editReply({
      content: dedent`
        ${author_t('server.Here are the members with the')} <@&${membershipRoleDoc._id}> ${author_t('server.role in this server')}
        ${author_t('server.You can use')} \`/${author_t('check_member_command.name')}\` ${author_t('server.to check a members membership status')}
      `,
      files: [
        new AttachmentBuilder(Buffer.from(csvData, 'utf-8'), {
          name: `${membershipRoleDoc.profile.name}_members.csv`,
        }),
      ],
    });
  }
}
