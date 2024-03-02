import { Client, Events } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';

export class ReadyEventHandler extends EventHandler<Events.ClientReady> {
  public readonly event = Events.ClientReady;
  public readonly once = true;

  public override async execute(client: Client<true>) {
    const { username, id } = client.user;
    this.context.logger.info(`Successfully logged in as ${username} (${id})`);
    await this.context.bot.registerCommands(id);
  }
}
