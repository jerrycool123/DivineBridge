import { Awaitable, ButtonInteraction, Guild } from 'discord.js';

import { BaseClass } from './base.js';

export namespace Button {
  export interface Context extends Omit<BaseClass.Context, 'bot'> {
    bot: BaseClass.Context<true>['bot'];
  }
  export interface ExecuteContext<GuildOnly extends boolean = true> {
    guild: GuildOnly extends true ? Guild : Guild | null;
  }
}

export abstract class Button<GuildOnly extends boolean = true> extends BaseClass<true> {
  public abstract readonly customId: string;
  public abstract readonly guildOnly: GuildOnly;
  public abstract readonly sameClientOnly: boolean;

  public constructor(protected readonly context: Button.Context) {
    super(context);
  }

  public isGuildOnly(): this is Button<true> {
    return this.guildOnly === true;
  }

  public abstract execute(
    interaction: ButtonInteraction,
    context: Button.ExecuteContext<GuildOnly>,
  ): Awaitable<unknown>;
}
