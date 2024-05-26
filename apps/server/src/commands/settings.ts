import { Embeds, MembershipRoleCollection, YouTubeChannelDoc } from '@divine-bridge/common';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Utils } from '../utils/index.js';

export class SettingsCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('settings_command.name')
    .setI18nDescription('settings_command.description')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false);
  public readonly devTeamOnly = false;
  public readonly guildOnly = true;
  public readonly moderatorOnly = true;

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { guild, guildDoc, author_t }: ChatInputCommand.ExecuteContext,
  ) {
    const { user } = interaction;

    await interaction.deferReply({ ephemeral: true });

    // Get guild config and membership roles
    const membershipRoleDocs = await MembershipRoleCollection.find({ guild: guild.id }).populate<{
      youtube: YouTubeChannelDoc | null;
    }>('youtube');

    // Send settings
    const guildSettingsEmbed = Embeds.serverSettings(
      author_t,
      Utils.convertUser(user),
      guildDoc,
      membershipRoleDocs,
    );
    await interaction.editReply({
      embeds: [guildSettingsEmbed],
    });
  }
}
