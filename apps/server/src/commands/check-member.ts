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
    .setName('check-member')
    .setDescription("Check a member's membership status in this server")
    .addUserOption((option) =>
      option
        .setName('member')
        .setDescription('The member to check the membership status for')
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
    const membershipStatusEmbed = Embeds.membershipStatus(Utils.convertUser(user), memberships);
    await interaction.editReply({
      embeds: [membershipStatusEmbed],
    });
  }
}
