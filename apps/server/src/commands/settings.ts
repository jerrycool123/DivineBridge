import { MembershipRoleCollection, YouTubeChannelDoc } from '@divine-bridge/common';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

import { Embeds } from '../components/embeds.js';
import { Database } from '../utils/database.js';

export class SettingsCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, preconditions: ['GuildOnly'] });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('settings')
        .setDescription('Display guild settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const { guild, user } = interaction;
    if (guild === null) return;

    await interaction.deferReply({ ephemeral: true });

    // Get guild config and membership roles
    const [guildDoc, membershipRoleDocs] = await Promise.all([
      Database.upsertGuild({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
      }),
      MembershipRoleCollection.find({ guild: guild.id }).populate<{
        youtube: YouTubeChannelDoc | null;
      }>('youtube'),
    ]);

    // Send settings
    const guildSettingsEmbed = Embeds.guildSettings(user, guildDoc, membershipRoleDocs);
    await interaction.editReply({
      embeds: [guildSettingsEmbed],
    });
  }
}
