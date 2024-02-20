import { REST } from '@discordjs/rest';
import {
  RESTAPIPartialCurrentUserGuild,
  RESTGetAPICurrentUserGuildsResult,
  Routes,
} from 'discord-api-types/v10';

import { DiscordUtils } from '../utils/discord.js';

export class DiscordOAuthAPI {
  private readonly rest = new REST({ version: '10', authPrefix: 'Bearer' });

  constructor(accessToken: string) {
    this.rest.setToken(accessToken);
  }

  public async getGuilds(): Promise<
    | {
        success: true;
        guilds: RESTAPIPartialCurrentUserGuild[];
      }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const guilds = (await this.rest.get(
        Routes.userGuilds(),
      )) as RESTGetAPICurrentUserGuildsResult;

      return { success: true, guilds };
    } catch (error) {
      const errorMessage = DiscordUtils.parseError(error);
      return { success: false, error: errorMessage };
    }
  }
}
