import { Events } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';

export class DebugEventHandler extends EventHandler<Events.Debug> {
  public readonly event = Events.Debug;
  public readonly once = false;

  public override execute(message: string) {
    this.context.logger.debug(message);
  }
}
