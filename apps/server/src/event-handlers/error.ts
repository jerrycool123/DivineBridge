import { Events } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';

export class ErrorEventHandler extends EventHandler<Events.Error> {
  public readonly event = Events.Error;
  public readonly once = false;

  public override execute(error: Error) {
    this.context.logger.error(error);
  }
}
