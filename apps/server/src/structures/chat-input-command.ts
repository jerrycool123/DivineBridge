import { GuildDoc } from '@divine-bridge/common';
import { TFunc } from '@divine-bridge/i18n';
import {
  AutocompleteInteraction,
  Awaitable,
  ChatInputCommandInteraction,
  Guild,
  PermissionResolvable,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

import { Core } from './core.js';

export namespace ChatInputCommand {
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

export abstract class ChatInputCommand<GuildOnly extends boolean = true> extends Core {
  public abstract readonly command: Omit<SlashCommandOptionsOnlyBuilder, '_sharedAddOptionMethod'>;
  public abstract readonly devTeamOnly: boolean;
  public abstract readonly guildOnly: GuildOnly;
  public abstract readonly moderatorOnly: boolean;
  public readonly requiredClientPermissions: PermissionResolvable[] = [];

  public isGuildOnly(): this is ChatInputCommand {
    return this.guildOnly === true;
  }

  public autocomplete(
    _interaction: AutocompleteInteraction,
    _context: ChatInputCommand.ExecuteContext<GuildOnly>,
  ): Awaitable<unknown> {
    throw new Error('Not implemented');
  }

  public abstract execute(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.ExecuteContext<GuildOnly>,
  ): Awaitable<unknown>;
}
