import { SlashCommandBuilder } from '@discordjs/builders';
import {
  OAuth2API,
  RESTAPIPartialCurrentUserGuild,
  RESTPostAPIApplicationGuildCommandsResult,
  Routes,
  UsersAPI,
} from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { container } from '@sapphire/framework';

import { Env } from '../utils/env.js';
import { Queue } from '../utils/queue.js';

export namespace DiscordService {
  export const apiQueue = new Queue('Discord API', {
    autoStart: true,
    intervalCap: 1,
    interval: 100,
  });

  export const getAccessToken = async (
    refreshToken: string,
  ): Promise<
    | { success: true; accessToken: string; newRefreshToken: string }
    | { success: false; error: string }
  > => {
    let accessToken: string | null = null,
      newRefreshToken: string | null = null;
    try {
      const discordRestApi = new REST({ version: '10', authPrefix: 'Bearer' }).setToken('dummy');
      const discordOAuth2Api = new OAuth2API(discordRestApi);
      const { access_token, refresh_token } = await discordOAuth2Api.refreshToken({
        client_id: Env.DISCORD_CLIENT_ID,
        client_secret: Env.DISCORD_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });
      accessToken = access_token;
      newRefreshToken = refresh_token;
    } catch (error) {
      container.logger.error(error);
    }
    if (accessToken === null || newRefreshToken === null) {
      return { success: false, error: 'Failed to get tokens' };
    }

    return { success: true, accessToken, newRefreshToken };
  };

  export const getCurrentUser = async (
    accessToken: string,
  ): Promise<{
    id: string;
    username: string;
    avatar: string;
  } | null> => {
    try {
      const discordRestApi = new REST({ version: '10', authPrefix: 'Bearer' }).setToken(
        accessToken,
      );
      const discordUsersApi = new UsersAPI(discordRestApi);
      const { id, username, avatar: avatarHash } = await discordUsersApi.getCurrent();
      let avatar: string;
      if (avatarHash === null) {
        const defaultAvatarNumber = parseInt(id) % 5;
        avatar = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
      } else {
        const format = avatarHash.startsWith('a_') ? 'gif' : 'png';
        avatar = `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.${format}`;
      }
      return { id, username, avatar };
    } catch (error) {
      container.logger.error(error);
      return null;
    }
  };

  export const getGuilds = async (
    accessToken: string,
  ): Promise<RESTAPIPartialCurrentUserGuild[]> => {
    try {
      const discordRestApi = new REST({ version: '10', authPrefix: 'Bearer' }).setToken(
        accessToken,
      );
      const discordUsersApi = new UsersAPI(discordRestApi);
      return await discordUsersApi.getGuilds();
    } catch (error) {
      container.logger.error(error);
      return [];
    }
  };

  export const createGuildApplicationCommand = async (
    guildId: string,
    command: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>,
  ): Promise<RESTPostAPIApplicationGuildCommandsResult | null> => {
    try {
      const discordRestApi = new REST({ version: '10' }).setToken(Env.DISCORD_BOT_TOKEN);
      return (await discordRestApi.post(
        Routes.applicationGuildCommands(Env.DISCORD_CLIENT_ID, guildId),
        {
          body: command.toJSON(),
        },
      )) as RESTPostAPIApplicationGuildCommandsResult;
    } catch (error) {
      container.logger.error(error);
      return null;
    }
  };

  export const deleteGuildApplicationCommand = async (
    guildId: string,
    commandId: string,
  ): Promise<boolean> => {
    try {
      const discordRestApi = new REST({ version: '10' }).setToken(Env.DISCORD_BOT_TOKEN);
      await discordRestApi.delete(
        Routes.applicationGuildCommand(Env.DISCORD_CLIENT_ID, guildId, commandId),
      );
      return true;
    } catch (error) {
      container.logger.error(error);
      return false;
    }
  };
}
