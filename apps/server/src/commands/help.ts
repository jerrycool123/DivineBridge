import {
  ActionRows,
  DiscordUtils,
  Embeds,
  MembershipRoleCollection,
  MembershipRoleDoc,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ComponentType,
  SlashCommandBuilder,
} from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';

export class HelpCommand extends ChatInputCommand<false> {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('help_command.name')
    .setI18nDescription('help_command.description');
  public readonly devTeamOnly = false;
  public readonly guildOnly = false;
  public readonly moderatorOnly = false;

  public async execute(
    interaction: ChatInputCommandInteraction,
    { author_t }: ChatInputCommand.ExecuteContext<false>,
  ) {
    const { guild } = interaction;

    let membershipRoleDocs:
      | (Omit<MembershipRoleDoc, 'youtube'> & {
          youtube: YouTubeChannelDoc;
        })[]
      | null = null;
    if (guild !== null) {
      membershipRoleDocs = (
        await MembershipRoleCollection.find({ guild: guild.id }).populate<{
          youtube: YouTubeChannelDoc | null;
        }>('youtube')
      ).filter(
        (
          membershipRoleDoc,
        ): membershipRoleDoc is Omit<MembershipRoleDoc, 'youtube'> & {
          youtube: YouTubeChannelDoc;
        } => membershipRoleDoc.youtube !== null,
      );
    }

    // Let user select a document
    const helpActionRow = ActionRows.help(author_t);
    const response = await interaction.reply({
      content: author_t('server.Click to view a tutorial'),
      ephemeral: true,
      components: [helpActionRow],
    });

    let timeout = false;
    while (timeout === false) {
      // Wait for user's confirmation
      let buttonInteraction: ButtonInteraction;
      try {
        buttonInteraction = await response.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (buttonInteraction) =>
            interaction.user.id === buttonInteraction.user.id &&
            [
              DiscordUtils.help.userTutorial,
              DiscordUtils.help.moderatorTutorial,
              DiscordUtils.help.commandList,
            ].includes(buttonInteraction.customId),
          time: 60 * 1000,
        });
      } catch (error) {
        // Timeout
        timeout = true;

        // Disable help action row
        helpActionRow.components.forEach((component) => component.setDisabled(true));
        await interaction.editReply({
          content: author_t('server.Timed out'),
          components: [helpActionRow],
        });
        break;
      }

      await interaction.editReply({
        components: [helpActionRow],
      });
      if (buttonInteraction.customId === DiscordUtils.help.userTutorial) {
        await buttonInteraction.reply({
          embeds: [Embeds.userTutorial(author_t, membershipRoleDocs)],
          ephemeral: true,
        });
      } else if (buttonInteraction.customId === DiscordUtils.help.moderatorTutorial) {
        await buttonInteraction.reply({
          embeds: [Embeds.moderatorTutorial(author_t)],
          ephemeral: true,
        });
      } else if (buttonInteraction.customId === DiscordUtils.help.commandList) {
        await buttonInteraction.reply({
          embeds: [
            Embeds.commandList(author_t, membershipRoleDocs, this.context.bot.chatInputCommandMap),
          ],
          ephemeral: true,
        });
      }
    }
  }
}
