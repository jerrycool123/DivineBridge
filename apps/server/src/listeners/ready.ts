import { Events, Listener } from '@sapphire/framework';
import { Client } from 'discord.js';

export class ReadyListener extends Listener<typeof Events.ClientReady> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, { ...options, once: true });
  }

  public run(client: Client<true>) {
    const { username, id } = client.user;
    this.container.logger.info(`Successfully logged in as ${username} (${id})`);
  }
}
