import { container } from '@sapphire/framework';
import { Guild, GuildBasedChannel, GuildMember } from 'discord.js';

export namespace Fetchers {
  export const fetchGuild = async (guildId: string): Promise<Guild | null> => {
    try {
      return await container.client.guilds.fetch(guildId);
    } catch (error) {
      container.logger.error(error);
    }
    return null;
  };

  export const fetchBotGuildMember = async (guild: Guild) => {
    try {
      return await guild.members.fetchMe();
    } catch (error) {
      container.logger.error(error);
    }
    return null;
  };

  export const fetchGuildChannel = async (
    guild: Guild,
    channelId: string,
  ): Promise<GuildBasedChannel | null> => {
    try {
      return await guild.channels.fetch(channelId);
    } catch (error) {
      container.logger.error(error);
    }
    return null;
  };

  export const fetchGuildMember = async (
    guild: Guild,
    userId: string,
  ): Promise<GuildMember | null> => {
    try {
      return await guild.members.fetch(userId);
    } catch (error) {
      container.logger.error(error);
    }
    return null;
  };

  export const fetchGuildOwner = async (guild: Guild): Promise<GuildMember | null> => {
    try {
      return await guild.fetchOwner();
    } catch (error) {
      container.logger.error(error);
    }
    return null;
  };
}
