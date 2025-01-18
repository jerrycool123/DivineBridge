import { GuildDoc } from '@divine-bridge/common';
import { TFunc } from '@divine-bridge/i18n';
import { Awaitable, ButtonInteraction, Guild } from 'discord.js';

import { Core } from './core.js';

export namespace Button {
  export interface CommonExecuteContext {
    authorLocale: string;
    author_t: TFunc;
  }

  export type ExecuteContext<GuildOnly extends boolean = true> = GuildOnly extends true
    ? {
        guild: GuildOnly extends true ? Guild : Guild | null;
        guildDoc: GuildOnly extends true ? GuildDoc : null;
        guildLocale: string;
        guild_t: TFunc;
      } & CommonExecuteContext
    : CommonExecuteContext;
}
export abstract class Button<GuildOnly extends boolean = true> extends Core {
  public abstract readonly customId: string;
  public abstract readonly guildOnly: GuildOnly;
  public abstract readonly sameClientOnly: boolean;

  public isGuildOnly(): this is Button {
    return this.guildOnly === true;
  }

  public abstract execute(
    interaction: ButtonInteraction,
    context: Button.ExecuteContext<GuildOnly>,
  ): Awaitable<unknown>;
}
