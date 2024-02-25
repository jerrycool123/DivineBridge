import { Database } from '@divine-bridge/common';
import { Events } from 'discord.js';
import { Guild } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';

export class GuildCreateEventHandler extends EventHandler<Events.GuildCreate> {
  public readonly event = Events.GuildCreate;
  public readonly once = false;

  public constructor(context: EventHandler.Context) {
    super(context);
  }

  public async execute(guild: Guild) {
    await Database.upsertGuild({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
    });
  }
}
