import {
  Database,
  Embeds,
  MembershipRoleCollection,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Utils } from '../utils/index.js';

export class SettingsCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Display guild settings')
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
    const { user } = interaction;

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
    const guildSettingsEmbed = Embeds.guildSettings(
      Utils.convertUser(user),
      guildDoc,
      membershipRoleDocs,
    );
    await interaction.editReply({
      embeds: [guildSettingsEmbed],
    });
  }
}
