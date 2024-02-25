import {
  AutocompleteInteraction,
  Awaitable,
  ChatInputCommandInteraction,
  Guild,
  PermissionResolvable,
  SlashCommandBuilder,
} from 'discord.js';

import { BaseClass } from './base.js';

export namespace ChatInputCommand {
  export interface Context extends Omit<BaseClass.Context, 'bot'> {
    bot: BaseClass.Context<true>['bot'];
  }
  export interface AutocompleteContext<GuildOnly extends boolean = true> {
    guild: GuildOnly extends true ? Guild : Guild | null;
  }
  export type ExecuteContext<GuildOnly extends boolean = true> =
    ChatInputCommand.AutocompleteContext<GuildOnly>;
}

export abstract class ChatInputCommand<GuildOnly extends boolean = true> extends BaseClass<true> {
  public abstract readonly command: Partial<Omit<SlashCommandBuilder, 'name' | 'toJSON'>> &
    Required<Pick<SlashCommandBuilder, 'name' | 'toJSON'>>;
  public abstract readonly global: boolean;
  public abstract readonly guildOnly: GuildOnly;
  public readonly requiredClientPermissions: PermissionResolvable = [];

  public constructor(protected readonly context: ChatInputCommand.Context) {
    super(context);
  }

  public isGuildOnly(): this is ChatInputCommand<true> {
    return this.guildOnly === true;
  }

  public autocomplete(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: AutocompleteInteraction,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ChatInputCommand.ExecuteContext<GuildOnly>,
  ): Awaitable<unknown> {
    throw new Error('Not implemented');
  }

  public abstract execute(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.ExecuteContext<GuildOnly>,
  ): Awaitable<unknown>;
}
