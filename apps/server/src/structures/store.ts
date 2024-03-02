import { Logger } from '@divine-bridge/common';
import { Client } from 'discord.js';

import { Bot } from './bot.js';

export class Store {
  #logger: Logger | null = null;
  #client: Client | null = null;
  #bot: Bot | null = null;

  public set logger(value: Logger) {
    this.#logger = value;
  }

  public get logger(): Logger {
    if (this.#logger === null) {
      throw new Error('Logger has not been initialized');
    }
    return this.#logger;
  }

  public set client(value: Client) {
    this.#client = value;
  }

  public get client(): Client {
    if (this.#client === null) {
      throw new Error('Client has not been initialized');
    }
    return this.#client;
  }

  public set bot(value: Bot) {
    this.#bot = value;
  }

  public get bot(): Bot {
    if (this.#bot === null) {
      throw new Error('Bot has not been initialized');
    }
    return this.#bot;
  }
}

export const store = new Store();
