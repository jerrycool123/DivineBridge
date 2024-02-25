import { MembershipRoleCollection } from '@divine-bridge/common';
import { Events, Interaction, PermissionsBitField } from 'discord.js';

import { VerifyCommand } from '../commands/verify.js';
import { ChatInputCommand } from '../structures/chat-input-command.js';
import { EventHandler } from '../structures/event-handler.js';
import { readablePermissionsMap } from '../utils/discord.js';

export class InteractionCreateEventHandler extends EventHandler<Events.InteractionCreate> {
  public readonly event = Events.InteractionCreate;
  public readonly once = false;

  public constructor(context: EventHandler.Context) {
    super(context);
  }

  public async execute(interaction: Interaction) {
    try {
      const { guild } = interaction;

      // Auto complete
      if (interaction.isAutocomplete()) {
        const { commandId, commandName } = interaction;
        if (commandName in this.bot.chatInputCommandMap === false) {
          this.bot.logger.error(`Autocomplete command not found: ${commandName} (${commandId})`);
          return;
        }
        const autoCompleteCommand = this.bot.chatInputCommandMap[commandName];
        if (autoCompleteCommand.isGuildOnly()) {
          if (guild === null) {
            return;
          }
          await autoCompleteCommand.autocomplete(interaction, { guild });
          return;
        }
        await autoCompleteCommand.autocomplete(interaction, { guild });
        return;
      }

      // Chat input command
      if (interaction.isChatInputCommand()) {
        const { commandId, commandName } = interaction;
        let chatInputCommand: ChatInputCommand<true> | ChatInputCommand<false> | null = null;
        if (commandName in this.bot.chatInputCommandMap) {
          chatInputCommand = this.bot.chatInputCommandMap[commandName];
        }

        // Check if the command is an alias of the verify command
        if (chatInputCommand === null && guild !== null) {
          const membershipRoleDoc = await MembershipRoleCollection.findOne({
            'guild': guild.id,
            'config.aliasCommandId': commandId,
          });
          if (membershipRoleDoc !== null) {
            const verifyCommand = this.bot.chatInputCommandMap['verify'] ?? null;
            if (verifyCommand !== null && verifyCommand instanceof VerifyCommand) {
              await verifyCommand.executeAlias(interaction, {
                membershipRoleId: membershipRoleDoc._id,
              });
              return;
            }
          }
        }

        if (chatInputCommand === null) {
          this.bot.logger.error(`Command not found: ${commandName} (${commandId})`);
          return;
        }

        if (chatInputCommand.isGuildOnly()) {
          if (guild === null) {
            await interaction.reply({
              content: 'This command is only available in a server.',
              ephemeral: true,
            });
            return;
          }

          // Check bot permissions if in a guild
          const permissions = new PermissionsBitField(chatInputCommand.requiredClientPermissions);
          const member = await guild.members.fetchMe({ force: true });
          const missingPermissions = member
            .permissionsIn(interaction.channelId)
            .missing(permissions);
          if (missingPermissions.length > 0) {
            await interaction.reply({
              content:
                'I need the following permission to run this command:\n' +
                missingPermissions
                  .map((permission) => `- ${readablePermissionsMap[permission]}`)
                  .join(', '),
              ephemeral: true,
            });
            return;
          }

          await chatInputCommand.execute(interaction, { guild });
          return;
        }
        await chatInputCommand.execute(interaction, { guild });
        return;
      }

      // Button
      if (interaction.isButton()) {
        const { customId } = interaction;
        if (customId in this.bot.buttonMap === false) {
          return;
        }
        const buttonCommand = this.bot.buttonMap[customId];
        if (
          buttonCommand.sameClientOnly &&
          (this.bot.client.user === null ||
            interaction.message.author.id !== this.bot.client.user.id)
        ) {
          return;
        } else if (buttonCommand.isGuildOnly()) {
          if (guild === null) {
            return;
          }
          await buttonCommand.execute(interaction, { guild });
          return;
        }
        await buttonCommand.execute(interaction, { guild });
        return;
      }
    } catch (error) {
      this.bot.logger.error(error);
    }
  }
}
