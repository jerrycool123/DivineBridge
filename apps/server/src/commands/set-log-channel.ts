import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

import { Database } from '../utils/database.js';
import { Validators } from '../utils/validators.js';

export class SetLogChannelCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, preconditions: ['GuildTextOnly'] });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('set-log-channel')
        .setDescription(
          'Set a log channel where the membership verification requests would be sent',
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('The log channel in this server')
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

    // Get log channel
    const channel = options.getChannel('channel', true);
    const logChannelResult = await Validators.isValidLogChannel(guild, channel.id);
    if (logChannelResult.success === false) {
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
      this.container.logger.error(error);
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
