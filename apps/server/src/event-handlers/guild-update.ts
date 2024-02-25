import { Database } from '@divine-bridge/common';
import { Events, Guild } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';

export class GuildUpdateEventHandler extends EventHandler<Events.GuildUpdate> {
  public readonly event = Events.GuildUpdate;
  public readonly once = false;

  public constructor(context: EventHandler.Context) {
    super(context);
  }

  public async execute(_oldGuild: Guild, newGuild: Guild) {
    await Database.upsertGuild({
      id: newGuild.id,
      name: newGuild.name,
      icon: newGuild.iconURL(),
    });
  }
}
