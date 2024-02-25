import { Awaitable, ClientEvents } from 'discord.js';

import { BaseClass } from './base.js';

export namespace EventHandler {
  export type Context = BaseClass.Context;
}

export abstract class EventHandler<E extends keyof ClientEvents> extends BaseClass {
  public abstract readonly event: E;
  public abstract readonly once: boolean;

  public constructor(protected readonly context: EventHandler.Context) {
    super(context);
  }

  public register() {
    this.bot.client[this.once ? 'once' : 'on']<E>(this.event, this.execute.bind(this));
  }

  public abstract execute(...args: ClientEvents[E]): Awaitable<void>;
}
