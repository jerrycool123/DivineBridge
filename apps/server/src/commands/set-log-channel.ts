import { Database } from '@divine-bridge/common';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Validators } from '../utils/validators.js';

export class SetLogChannelCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setName('set-log-channel')
    .setDescription('Set a log channel where the membership verification requests would be sent')
    .addChannelOption((option) =>
      option.setName('channel').setDescription('The log channel in this server').setRequired(true),
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

    await interaction.deferReply({ ephemeral: true });

    // Get log channel
    const channel = options.getChannel('channel', true);
    const logChannelResult = await Validators.isValidLogChannel(guild, channel.id);
    if (!logChannelResult.success) {
      return await interaction.editReply({
        content: logChannelResult.error,
      });
    }
    const { data: logChannel } = logChannelResult;

    // Check if the bot can send messages in the log channel
    try {
      await logChannel.send({
        content: 'I will send membership screenshots to this channel.',
      });
    } catch (error) {
      this.bot.logger.debug(error);
      return await interaction.editReply({
        content: `The bot does not enough permission to send messages in  <#${logChannel.id}>.`,
      });
    }

    // Add the log channel to DB
    const guildDoc = await Database.upsertGuild({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      logChannel: channel.id,
    });

    if (guildDoc.config.logChannel === null) {
      return await interaction.editReply({
        content: 'Failed to set the log channel.',
      });
    }

    await interaction.editReply({
      content: `The log channel has been set to <#${guildDoc.config.logChannel}>.`,
    });
  }
}
