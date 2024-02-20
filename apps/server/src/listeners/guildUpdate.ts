import { Database } from '@divine-bridge/common';
import { Events, Listener } from '@sapphire/framework';
import { Guild } from 'discord.js';

export class GuildUpdateListener extends Listener<typeof Events.GuildUpdate> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, options);
  }

  public async run(_oldGuild: Guild, newGuild: Guild) {
    await Database.upsertGuild({
      id: newGuild.id,
      name: newGuild.name,
      icon: newGuild.iconURL(),
    });
  }
}
