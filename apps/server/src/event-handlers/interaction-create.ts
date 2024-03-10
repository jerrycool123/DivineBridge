import { Database, MembershipRoleCollection } from '@divine-bridge/common';
import { defaultLocale, t } from '@divine-bridge/i18n';
import { Events, Interaction, PermissionsBitField } from 'discord.js';

import { VerifyCommand } from '../commands/verify.js';
import { ChatInputCommand } from '../structures/chat-input-command.js';
import { EventHandler } from '../structures/event-handler.js';
import { readablePermissionsMap } from '../utils/discord.js';
import { Utils } from '../utils/index.js';

export class InteractionCreateEventHandler extends EventHandler<Events.InteractionCreate> {
  public readonly event = Events.InteractionCreate;
  public readonly once = false;

  public override async execute(interaction: Interaction) {
    try {
      const { guild, user, locale } = interaction;

      // Auto complete
      if (interaction.isAutocomplete()) {
        const { commandId, commandName } = interaction;
        if (commandName in this.context.bot.chatInputCommandMap === false) {
          this.context.logger.error(
            `Autocomplete command not found: ${commandName} (${commandId})`,
          );
          return;
        }
        const autoCompleteCommand = this.context.bot.chatInputCommandMap[commandName];
        if (!autoCompleteCommand.isGuildOnly()) {
          const authorDoc = await Database.upsertUser({ ...Utils.convertUser(user), locale });
          const authorLocale = authorDoc.preference.locale;
          await autoCompleteCommand.autocomplete(interaction, {
            authorLocale,
            author_t: (key) => t(key, authorLocale),
          });
        } else if (guild !== null) {
          const [authorDoc, guildDoc] = await Promise.all([
            Database.upsertUser({ ...Utils.convertUser(user), locale }),
            Database.upsertGuild(Utils.convertGuild(guild)),
          ]);

          // Set the locale of the guild if it has not been set yet, and the command is moderator only
          if (autoCompleteCommand.moderatorOnly && guildDoc.config.locale === null) {
            guildDoc.config.locale = authorDoc.preference.locale;
            await guildDoc.save();
          }

          const guildLocale = guildDoc.config.locale ?? defaultLocale;
          const authorLocale = authorDoc.preference.locale;

          await autoCompleteCommand.autocomplete(interaction, {
            guild,
            guildDoc,
            guildLocale,
            guild_t: (key) => t(key, guildLocale),
            authorLocale,
            author_t: (key) => t(key, authorLocale),
          });
        }
        return;
      }

      // Chat input command
      if (interaction.isChatInputCommand()) {
        const { commandId, commandName } = interaction;
        let chatInputCommand: ChatInputCommand<true> | ChatInputCommand<false> | null = null;
        if (commandName in this.context.bot.chatInputCommandMap) {
          chatInputCommand = this.context.bot.chatInputCommandMap[commandName];
        }

        // Check if the command is an alias of the verify command
        if (chatInputCommand === null && guild !== null) {
          const [membershipRoleDoc, authorDoc, guildDoc] = await Promise.all([
            MembershipRoleCollection.findOne({
              'guild': guild.id,
              'config.aliasCommandId': commandId,
            }),
            Database.upsertUser({ ...Utils.convertUser(user), locale }),
            Database.upsertGuild(Utils.convertGuild(guild)),
          ]);
          const guildLocale = guildDoc.config.locale ?? defaultLocale;
          const authorLocale = authorDoc.preference.locale;
          if (membershipRoleDoc !== null) {
            const verifyCommand = this.context.bot.chatInputCommandMap['verify'] ?? null;
            if (verifyCommand !== null && verifyCommand instanceof VerifyCommand) {
              await verifyCommand.executeAlias(
                interaction,
                { membershipRoleId: membershipRoleDoc._id },
                {
                  guild,
                  guildDoc,
                  guildLocale,
                  guild_t: (key) => t(key, guildLocale),
                  authorLocale,
                  author_t: (key) => t(key, authorLocale),
                },
              );
              return;
            }
          }
        }

        if (chatInputCommand === null) {
          this.context.logger.error(`Command not found: ${commandName} (${commandId})`);
          return;
        }

        if (!chatInputCommand.isGuildOnly()) {
          const authorDoc = await Database.upsertUser({ ...Utils.convertUser(user), locale });
          const authorLocale = authorDoc.preference.locale;
          await chatInputCommand.execute(interaction, {
            authorLocale,
            author_t: (key) => t(key, authorLocale),
          });
        } else if (guild !== null) {
          // Check bot permissions if in a guild
          const permissions = new PermissionsBitField(chatInputCommand.requiredClientPermissions);
          const [member, authorDoc, guildDoc] = await Promise.all([
            guild.members.fetchMe({ force: true }),
            Database.upsertUser({ ...Utils.convertUser(user), locale }),
            Database.upsertGuild(Utils.convertGuild(guild)),
          ]);
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

          // Set the locale of the guild if it has not been set yet, and the command is moderator only
          if (chatInputCommand.moderatorOnly && guildDoc.config.locale === null) {
            guildDoc.config.locale = authorDoc.preference.locale;
            await guildDoc.save();
          }

          const guildLocale = guildDoc.config.locale ?? defaultLocale;
          const authorLocale = authorDoc.preference.locale;

          await chatInputCommand.execute(interaction, {
            guild,
            guildDoc,
            guildLocale,
            guild_t: (key) => t(key, guildLocale),
            authorLocale,
            author_t: (key) => t(key, authorLocale),
          });
        } else {
          await interaction.reply({
            content: 'This command is only available in a server.',
            ephemeral: true,
          });
        }
        return;
      }

      // Button
      if (interaction.isButton()) {
        const { customId } = interaction;
        if (customId in this.context.bot.buttonMap === false) {
          return;
        }
        const buttonCommand = this.context.bot.buttonMap[customId];
        if (
          buttonCommand.sameClientOnly &&
          (this.context.client.user === null ||
            interaction.message.author.id !== this.context.client.user.id)
        ) {
          return;
        } else if (!buttonCommand.isGuildOnly()) {
          const authorDoc = await Database.upsertUser({ ...Utils.convertUser(user), locale });
          const authorLocale = authorDoc.preference.locale;
          await buttonCommand.execute(interaction, {
            authorLocale: authorDoc.preference.locale,
            author_t: (key) => t(key, authorLocale),
          });
          return;
        } else if (guild !== null) {
          const [authorDoc, guildDoc] = await Promise.all([
            Database.upsertUser({ ...Utils.convertUser(user), locale }),
            Database.upsertGuild(Utils.convertGuild(guild)),
          ]);
          const guildLocale = guildDoc.config.locale ?? defaultLocale;
          const authorLocale = authorDoc.preference.locale;
          await buttonCommand.execute(interaction, {
            guild,
            guildDoc,
            guildLocale,
            guild_t: (key) => t(key, guildLocale),
            authorLocale,
            author_t: (key) => t(key, authorLocale),
          });
        }
        return;
      }
    } catch (error) {
      this.context.logger.error(error);
    }
  }
}
