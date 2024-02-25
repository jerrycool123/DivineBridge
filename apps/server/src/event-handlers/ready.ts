import { Client, Events } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';

export class ReadyEventHandler extends EventHandler<Events.ClientReady> {
  public readonly event = Events.ClientReady;
  public readonly once = true;

  constructor(context: EventHandler.Context) {
    super(context);
  }

  public execute(client: Client<true>) {
    const { username, id } = client.user;
    this.bot.logger.info(`Successfully logged in as ${username} (${id})`);

    this.bot.registerChatInputCommands();
    this.bot.registerButtons();
  }
}
