import { Logger } from '@divine-bridge/common';
import { Client, ClientEvents, ClientOptions } from 'discord.js';
import fs from 'node:fs';
import { z } from 'zod';

import { cryptoUtils } from '../utils/crypto.js';
import { discordBotApi } from '../utils/discord.js';
import { Env } from '../utils/env.js';
import { Button } from './button.js';
import { ChatInputCommand } from './chat-input-command.js';
import { Core } from './core.js';
import { EventHandler } from './event-handler.js';

export namespace Bot {
  export type EventHandlers = EventHandler<keyof ClientEvents>[];
  export type ChatInputCommandsMap = Record<string, ChatInputCommand | ChatInputCommand<false>>;
  export type ButtonsMap = Record<string, Button | Button<false>>;
  export type EventHandlersClass = EventHandler<keyof ClientEvents>;
  export type ChatInputCommandClass = ChatInputCommand<boolean>;
  export type ButtonClass = Button<boolean>;
}

export class Bot extends Core {
  public readonly eventHandlers: Bot.EventHandlers = [];
  public readonly chatInputCommandMap: Bot.ChatInputCommandsMap = {};
  public readonly buttonMap: Bot.ButtonsMap = {};

  public constructor(args: {
    logger: Logger;
    options: ClientOptions;
    eventHandlers: Bot.EventHandlersClass[];
    chatInputCommands: Bot.ChatInputCommandClass[];
    buttons: Bot.ButtonClass[];
  }) {
    super();
    this.context.logger = args.logger;
    this.context.client = new Client(args.options);
    this.context.bot = this;
    this.eventHandlers = args.eventHandlers;
    for (const chatInputCommand of args.chatInputCommands) {
      this.chatInputCommandMap[chatInputCommand.command.name] = chatInputCommand;
    }
    for (const button of args.buttons) {
      this.buttonMap[button.customId] = button;
    }
  }

  public async start(token: string) {
    this.registerEventHandlers();
    return await this.context.client.login(token);
  }

  public async registerCommands(applicationId: string) {
    // Hash the commands and compare with the previous hash
    const globalCommands = Object.values(this.chatInputCommandMap)
      .filter((chatInputCommand) => !chatInputCommand.devTeamOnly)
      .map(({ command }) => command.toJSON());
    const devTeamOnlyCommands = Object.values(this.chatInputCommandMap)
      .filter((chatInputCommand) => chatInputCommand.devTeamOnly)
      .map(({ command }) => command.toJSON());
    const hashResult = cryptoUtils.hash(
      JSON.stringify([...globalCommands, ...devTeamOnlyCommands]),
    );
    if (!hashResult.success) {
      throw new Error('Failed to hash the commands');
    }
    const { hash } = hashResult;

    // Load the previous hash from './.commands-hash.json'
    const hashFile = './.commands-hash.json';
    let cached = false;
    if (fs.existsSync(hashFile)) {
      try {
        const hashSchema = z.object({ hash: z.string() });
        const previousHash = hashSchema.parse(
          JSON.parse(fs.readFileSync('./.commands-hash.json', 'utf-8')),
        ).hash;
        if (previousHash === hash) {
          cached = true;
        }
      } catch (error) {
        this.context.logger.error('Failed to read the previous hash', error);
      }
    }

    // Write the new hash to './.commands-hash.json'
    fs.writeFileSync(hashFile, JSON.stringify({ hash }), 'utf-8');

    if (!cached) {
      this.context.logger.debug('Cache miss, overwriting global application commands');
      await discordBotApi.overwriteGlobalApplicationCommands(applicationId, globalCommands);
      for (const devTeamOnlyCommand of devTeamOnlyCommands) {
        await discordBotApi.createGuildApplicationCommand(
          applicationId,
          Env.DEV_TEAM_DISCORD_GUILD_ID,
          devTeamOnlyCommand,
        );
      }
    } else {
      this.context.logger.debug('Cache hit, skipping updating global application commands');
    }
    this.context.logger.debug('Registered chat input commands');
  }

  private registerEventHandlers() {
    for (const eventHandler of this.eventHandlers) {
      this.context.client[eventHandler.once ? 'once' : 'on'](
        eventHandler.event,
        eventHandler.execute.bind(eventHandler),
      );
    }
    this.context.logger.debug('Registered event handlers');
  }
}
