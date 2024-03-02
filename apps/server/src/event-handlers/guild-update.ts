import { Database } from '@divine-bridge/common';
import { Events, Guild } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';
import { Utils } from '../utils/index.js';

export class GuildUpdateEventHandler extends EventHandler<Events.GuildUpdate> {
  public readonly event = Events.GuildUpdate;
  public readonly once = false;

  public override async execute(_oldGuild: Guild, newGuild: Guild) {
    await Database.upsertGuild(Utils.convertGuild(newGuild));
  }
}
