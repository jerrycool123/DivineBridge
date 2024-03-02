import { supportedLocales } from '@divine-bridge/i18n';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';

export class SetLanguageCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('set_language_command.name')
    .setI18nDescription('set_language_command.description')
    .addStringOption((option) =>
      option
        .setI18nName('set_language_command.language_option_name')
        .setI18nDescription('set_language_command.language_option_description')
        .addChoices(...supportedLocales.map((locale) => ({ name: locale, value: locale })))
        .setRequired(true),
    );
  public readonly global = true;
  public readonly guildOnly = true;
  public readonly moderatorOnly = true;

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { guildDoc, author_t }: ChatInputCommand.ExecuteContext,
  ) {
    const { options } = interaction;

    await interaction.deferReply({ ephemeral: true });

    const language = options.getString('language', true);
    guildDoc.config.locale = language;
    await guildDoc.save();

    await interaction.editReply({
      content: `${author_t(`server.The language of the bot in this server has been set to`)} \`${language}\``,
    });
  }
}
