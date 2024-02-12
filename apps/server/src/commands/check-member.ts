import { MembershipCollection, MembershipDoc, MembershipRoleDoc } from '@divine-bridge/common';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

import { Embeds } from '../components/embeds.js';

export class CheckMemberCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, preconditions: ['GuildOnly'] });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('check-member')
        .setDescription("Check a member's membership status in this server")
        .addUserOption((option) =>
          option
            .setName('member')
            .setDescription('The member to check the membership status for')
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
    const membershipStatusEmbed = Embeds.membershipStatus(user, memberships);
    await interaction.editReply({
      embeds: [membershipStatusEmbed],
    });
  }
}
