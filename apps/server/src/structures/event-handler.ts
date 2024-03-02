import type { Awaitable, ClientEvents } from 'discord.js';

import { Core } from './core.js';

export abstract class EventHandler<E extends keyof ClientEvents> extends Core {
  public abstract readonly event: E;
  public abstract readonly once: boolean;

  public abstract execute(..._args: ClientEvents[E]): Awaitable<void>;
}
