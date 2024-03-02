import { Events } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';

export class WarnEventHandler extends EventHandler<Events.Warn> {
  public readonly event = Events.Warn;
  public readonly once = false;

  public override execute(message: string) {
    this.context.logger.warn(message);
  }
}
