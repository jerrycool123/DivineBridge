import { REST } from '@discordjs/rest';
import {
  APIChannel,
  APIGuild,
  APIGuildMember,
  APIMessage,
  APIUser,
  RESTGetAPIChannelResult,
  RESTGetAPIGuildMemberResult,
  RESTGetAPIGuildResult,
  RESTGetAPIUserResult,
  RESTPostAPIApplicationGuildCommandsResult,
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageResult,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPICurrentUserCreateDMChannelJSONBody,
  RESTPostAPICurrentUserCreateDMChannelResult,
  Routes,
} from 'discord-api-types/v10';

import { DiscordUtils } from '../utils/discord.js';
import { Queue } from '../utils/queue.js';

export class DiscordBotAPI {
  private readonly rest = new REST({ version: '10', authPrefix: 'Bot' });
  public readonly apiQueue = new Queue('Discord Bot API', {
    autoStart: true,
    intervalCap: 1,
    interval: 100,
  });

  constructor(botToken: string) {
    this.rest.setToken(botToken);
  }

  public async createGuildApplicationCommand(
    applicationId: string,
    guildId: string,
    rawCommand: RESTPostAPIChatInputApplicationCommandsJSONBody,
  ): Promise<
    | {
        success: true;
        command: RESTPostAPIApplicationGuildCommandsResult;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const command = (await this.rest.post(
        Routes.applicationGuildCommands(applicationId, guildId),
        {
          body: rawCommand,
        },
      )) as RESTPostAPIApplicationGuildCommandsResult;

      return { success: true, command };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }

  public async deleteGuildApplicationCommand(
    applicationId: string,
    guildId: string,
    commandId: string,
  ): Promise<
    | {
        success: true;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      await this.rest.delete(Routes.applicationGuildCommand(applicationId, guildId, commandId));

      return { success: true };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }

  public async fetchUser(userId: string): Promise<
    | {
        success: true;
        user: APIUser;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const user = (await this.rest.get(Routes.user(userId))) as RESTGetAPIUserResult;
      return { success: true, user };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }

  public async fetchGuildMember(
    guildId: string,
    userId: string,
  ): Promise<
    | {
        success: true;
        member: Omit<APIGuildMember, 'user'> & Required<Pick<APIGuildMember, 'user'>>;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const member = (await this.rest.get(
        Routes.guildMember(guildId, userId),
      )) as RESTGetAPIGuildMemberResult;
      if (member.user === undefined) {
        throw new Error('User not found');
      }
      return { success: true, member: { ...member, user: member.user } };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }

  public async fetchChannel(channelId: string): Promise<
    | {
        success: true;
        channel: APIChannel;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const channel = (await this.rest.get(Routes.channel(channelId))) as RESTGetAPIChannelResult;
      return { success: true, channel };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }

  public async fetchGuild(guildId: string): Promise<
    | {
        success: true;
        guild: APIGuild;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const guild = (await this.rest.get(Routes.guild(guildId))) as RESTGetAPIGuildResult;
      return { success: true, guild };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }

  public async createDMMessage(
    userId: string,
    body: RESTPostAPIChannelMessageJSONBody,
  ): Promise<
    | {
        success: true;
        message: APIMessage;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const dmBody: RESTPostAPICurrentUserCreateDMChannelJSONBody = {
        recipient_id: userId,
      };
      const { id: channelId } = (await this.rest.post(Routes.userChannels(), {
        body: dmBody,
      })) as RESTPostAPICurrentUserCreateDMChannelResult;
      return await this.createChannelMessage(channelId, body);
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }

  public async createChannelMessage(
    channelId: string,
    body: RESTPostAPIChannelMessageJSONBody,
  ): Promise<
    | {
        success: true;
        message: APIMessage;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const message = (await this.rest.post(Routes.channelMessages(channelId), {
        body,
      })) as RESTPostAPIChannelMessageResult;
      return { success: true, message };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }

  public async addGuildMemberRole(
    guildId: string,
    userId: string,
    roleId: string,
  ): Promise<
    | {
        success: true;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      await this.rest.put(Routes.guildMemberRole(guildId, userId, roleId));
      return { success: true };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }

  public async removeGuildMemberRole(
    guildId: string,
    userId: string,
    roleId: string,
  ): Promise<
    | {
        success: true;
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      await this.rest.delete(Routes.guildMemberRole(guildId, userId, roleId));
      return { success: true };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }
}
