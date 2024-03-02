import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Validators } from '../utils/validators.js';

export class SetLogChannelCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('set_log_channel_command.name')
    .setI18nDescription('set_log_channel_command.description')
    .addChannelOption((option) =>
      option
        .setI18nName('set_log_channel_command.channel_option_name')
        .setI18nDescription('set_log_channel_command.channel_option_description')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false);
  public readonly global = true;
  public readonly guildOnly = true;
  public readonly moderatorOnly = true;

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { guild, guildDoc, guild_t, author_t }: ChatInputCommand.ExecuteContext,
  ) {
    const { options } = interaction;

    await interaction.deferReply({ ephemeral: true });

    // Get log channel
    const channel = options.getChannel('channel', true);
    const logChannelResult = await Validators.isValidLogChannel(author_t, guild, channel.id);
    if (!logChannelResult.success) {
      return await interaction.editReply({
        content: logChannelResult.error,
      });
    }
    const { data: logChannel } = logChannelResult;

    // Check if the bot can send messages in the log channel
    try {
      await logChannel.send({
        content: guild_t('server.I will send membership screenshots to this channel'),
      });
    } catch (error) {
      this.context.logger.debug(error);
      return await interaction.editReply({
        content: `${author_t('server.The bot does not enough permission to send messages in')}  <#${logChannel.id}>`,
      });
    }

    // Add the log channel to DB
    guildDoc.config.logChannel = channel.id;
    await guildDoc.save();

    await interaction.editReply({
      content: `${author_t('server.The log channel has been set to')} <#${guildDoc.config.logChannel}>`,
    });
  }
}
