import { Database, MembershipRoleCollection, YouTubeChannelDoc } from '@divine-bridge/common';
import { Events, GuildFeature } from 'discord.js';
import { Guild } from 'discord.js';

import { VerifyCommand } from '../commands/verify.js';
import { EventHandler } from '../structures/event-handler.js';
import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { logger } from '../utils/logger.js';

export class GuildCreateEventHandler extends EventHandler<Events.GuildCreate> {
  public readonly event = Events.GuildCreate;
  public readonly once = false;

  public override async execute(guild: Guild) {
    if (this.context.client.user === null) {
      logger.error('Client user is null');
      return;
    }

    // Set locale of the guild if the guild is a Community Guild
    let locale: string | undefined = undefined;
    if (guild.features.includes(GuildFeature.Community)) {
      locale = guild.preferredLocale;
    }

    await Database.upsertGuild({ ...Utils.convertGuild(guild), locale });

    // Register the alias command for each membership role
    const verifyCommand = this.context.bot.chatInputCommandMap['verify'] ?? null;
    if (verifyCommand !== null && verifyCommand instanceof VerifyCommand === false) {
      logger.error('Verify command not found');
      return;
    }
    const membershipRoleDocs = await MembershipRoleCollection.find({ guild: guild.id }).populate<{
      youtube: YouTubeChannelDoc;
    }>('youtube');
    for (const membershipRoleDoc of membershipRoleDocs) {
      const aliasCommand = verifyCommand.commandFactory({
        alias: true,
        name: membershipRoleDoc.config.aliasCommandName,
        youtubeChannelTitle: membershipRoleDoc.youtube.profile.title,
      });
      const createResult = await discordBotApi.createGuildApplicationCommand(
        this.context.client.user.id,
        guild.id,
        aliasCommand.toJSON(),
      );
      if (!createResult.success) {
        logger.error('Failed to create alias command', createResult.error);
        continue;
      }
      const aliasCommandId = createResult.command.id;
      await membershipRoleDoc.updateOne({ 'config.aliasCommandId': aliasCommandId });

      logger.info(
        `Created alias command: ${aliasCommand.name} (${aliasCommandId}) for role ${membershipRoleDoc.profile.name} (${membershipRoleDoc._id})`,
      );
    }
  }
}
