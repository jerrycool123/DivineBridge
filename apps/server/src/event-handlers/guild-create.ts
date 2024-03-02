import { Database } from '@divine-bridge/common';
import { Events, GuildFeature } from 'discord.js';
import { Guild } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';
import { Utils } from '../utils/index.js';

export class GuildCreateEventHandler extends EventHandler<Events.GuildCreate> {
  public readonly event = Events.GuildCreate;
  public readonly once = false;

  public override async execute(guild: Guild) {
    // Set locale of the guild if the guild is a Community Guild
    let locale: string | undefined = undefined;
    if (guild.features.includes(GuildFeature.Community)) {
      locale = guild.preferredLocale;
    }

    await Database.upsertGuild({ ...Utils.convertGuild(guild), locale });
  }
}
