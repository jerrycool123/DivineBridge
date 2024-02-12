import { REST } from '@discordjs/rest';
import {
  RESTDeleteAPIGuildMemberRoleResult,
  RESTGetAPIChannelResult,
  RESTGetAPIGuildMemberResult,
  RESTGetAPIGuildResult,
  RESTGetAPIUserResult,
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageResult,
  RESTPostAPICurrentUserCreateDMChannelJSONBody,
  RESTPostAPICurrentUserCreateDMChannelResult,
  Routes,
} from 'discord-api-types/v10';

import { Env } from './env.js';

export namespace DiscordAPI {
  const rest = new REST({ version: '10' }).setToken(Env.DISCORD_BOT_TOKEN);

  export const fetchUser = async (userId: string): Promise<RESTGetAPIUserResult | null> => {
    try {
      return (await rest.get(Routes.user(userId))) as RESTGetAPIUserResult;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  export const fetchGuildMember = async (
    guildId: string,
    userId: string,
  ): Promise<RESTGetAPIGuildMemberResult | null> => {
    try {
      return (await rest.get(Routes.guildMember(guildId, userId))) as RESTGetAPIGuildMemberResult;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  export const fetchChannel = async (
    channelId: string,
  ): Promise<RESTGetAPIChannelResult | null> => {
    try {
      return (await rest.get(Routes.channel(channelId))) as RESTGetAPIChannelResult;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  export const fetchGuild = async (guildId: string): Promise<RESTGetAPIGuildResult | null> => {
    try {
      return (await rest.get(Routes.guild(guildId))) as RESTGetAPIGuildResult;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  export const createDMMessage = async (
    userId: string,
    body: RESTPostAPIChannelMessageJSONBody,
  ): Promise<RESTPostAPIChannelMessageResult | null> => {
    try {
      const dmBody: RESTPostAPICurrentUserCreateDMChannelJSONBody = {
        recipient_id: userId,
      };
      const { id: channelId } = (await rest.post(Routes.userChannels(), {
        body: dmBody,
      })) as RESTPostAPICurrentUserCreateDMChannelResult;
      return await createChannelMessage(channelId, body);
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  export const createChannelMessage = async (
    channelId: string,
    body: RESTPostAPIChannelMessageJSONBody,
  ): Promise<RESTPostAPIChannelMessageResult | null> => {
    try {
      return (await rest.post(Routes.channelMessages(channelId), {
        body,
      })) as RESTPostAPIChannelMessageResult;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  export const removeGuildMemberRole = async (
    guildId: string,
    userId: string,
    roleId: string,
  ): Promise<boolean> => {
    try {
      (await rest.delete(
        Routes.guildMemberRole(guildId, userId, roleId),
      )) as RESTDeleteAPIGuildMemberRoleResult;
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };
}
