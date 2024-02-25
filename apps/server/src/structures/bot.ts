import { Logger } from '@divine-bridge/common';
import { Client, ClientOptions, Events } from 'discord.js';

import { Buttons, ChatInputCommands, EventHandlers } from '../bot.js';
import { Button } from './button.js';
import { ChatInputCommand } from './chat-input-command.js';
import { EventHandler } from './event-handler.js';

export class Bot<Ready extends boolean = boolean> {
  public readonly client: Client<Ready>;
  public readonly logger: Logger;
  public readonly eventHandlers: EventHandler<Events>[] = [];
  public readonly chatInputCommandMap: Record<
    string,
    ChatInputCommand<true> | ChatInputCommand<false>
  > = {};
  public readonly buttonMap: Record<string, Button<true> | Button<false>> = {};

  private readonly eventHandlerClasses: EventHandlers;
  private readonly chatInputCommandClasses: ChatInputCommands;
  private readonly buttonClasses: Buttons;

  public constructor(args: {
    options: ClientOptions;
    logger: Logger;
    eventHandlers: EventHandlers;
    chatInputCommands: ChatInputCommands;
    buttons: Buttons;
  }) {
    this.client = new Client(args.options);
    this.logger = args.logger;
    this.eventHandlerClasses = args.eventHandlers;
    this.chatInputCommandClasses = args.chatInputCommands;
    this.buttonClasses = args.buttons;
  }

  public async start(token: string) {
    this.registerEventHandlers();
    return await this.client.login(token);
  }

  private registerEventHandlers() {
    for (const eventHandlerClass of this.eventHandlerClasses) {
      const eventHandler = new eventHandlerClass({ bot: this });
      eventHandler.register();
      this.eventHandlers.push(eventHandler);
    }
    this.logger.debug('Registered event handlers');
  }

  public registerChatInputCommands() {
    if (!this.client.isReady()) {
      throw new Error('Client is not ready');
    }

    for (const chatInputCommandClass of this.chatInputCommandClasses) {
      const chatInputCommand = new chatInputCommandClass({ bot: this as Bot<true> });
      this.chatInputCommandMap[chatInputCommand.command.name] = chatInputCommand;
    }
    this.logger.debug('Registered chat input commands');
  }

  public registerButtons() {
    if (!this.client.isReady()) {
      throw new Error('Client is not ready');
    }

    if (this.client.isReady()) {
      for (const buttonClass of this.buttonClasses) {
        const button = new buttonClass({ bot: this as Bot<true> });
        this.buttonMap[button.customId] = button;
      }
    }
    this.logger.debug('Registered buttons');
  }
}
