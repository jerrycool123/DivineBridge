import {
  Embeds,
  MembershipCollection,
  MembershipDoc,
  MembershipRoleDoc,
} from '@divine-bridge/common';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Utils } from '../utils/index.js';

export class CheckMemberCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('check_member_command.name')
    .setI18nDescription('check_member_command.description')
    .addUserOption((option) =>
      option
        .setI18nName('check_member_command.member_option_name')
        .setI18nDescription('check_member_command.member_option_description')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false);
  public readonly global = true;
  public readonly guildOnly = true;
  public readonly moderatorOnly = true;

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { guild, author_t }: ChatInputCommand.ExecuteContext,
  ) {
    const { options } = interaction;

    await interaction.deferReply({ ephemeral: true });

    // Get membership status from database
    const user = options.getUser('member', true);
    const membershipDocs = await MembershipCollection.find({
      user: user.id,
    }).populate<{ membershipRole: MembershipRoleDoc }>('membershipRole');

    // Filter out memberships that are not in this guild
    const filteredMembershipDocs = membershipDocs.filter(
      (membershipDoc) => membershipDoc.membershipRole.guild === guild.id,
    );

    const memberships: Record<
      MembershipDoc['type'],
      (Omit<MembershipDoc, 'membershipRole'> & {
        membershipRole: MembershipRoleDoc;
      })[]
    > = {
      manual: [],
      screenshot: [],
      auth: [],
      live_chat: [],
    };
    for (const membershipDoc of filteredMembershipDocs) {
      memberships[membershipDoc.type].push(membershipDoc);
    }

    // Organize membership status to embed and display
    const membershipStatusEmbed = Embeds.membershipStatus(
      author_t,
      Utils.convertUser(user),
      memberships,
    );
    await interaction.editReply({
      embeds: [membershipStatusEmbed],
    });
  }
}
