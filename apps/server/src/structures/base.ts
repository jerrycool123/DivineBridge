import { Bot } from './bot.js';

export namespace BaseClass {
  export interface Context<Ready extends boolean = boolean> {
    bot: Bot<Ready>;
  }
}

export class BaseClass<Ready extends boolean = boolean> {
  protected readonly bot: Bot<Ready>;

  constructor(context: BaseClass.Context<Ready>) {
    this.bot = context.bot;
  }
}
