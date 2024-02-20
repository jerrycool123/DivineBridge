import { Database } from '@divine-bridge/common';
import { Events, Listener } from '@sapphire/framework';
import { Guild } from 'discord.js';

export class GuildCreateListener extends Listener<typeof Events.GuildCreate> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, options);
  }

  public async run(guild: Guild) {
    await Database.upsertGuild({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
    });
  }
}
