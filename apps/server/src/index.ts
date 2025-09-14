import { initI18n } from '@divine-bridge/i18n';
import mongoose from 'mongoose';

import './augmentations.js';
import {
  MembershipAcceptButton,
  MembershipModifyButton,
  MembershipRejectButton,
} from './buttons/index.js';
import {
  AddMemberCommand,
  AddRoleCommand,
  BroadcastCommand,
  CheckMemberCommand,
  DeleteMemberCommand,
  DeleteRoleCommand,
  HelpCommand,
  PingCommand,
  SetLanguageCommand,
  SetLogChannelCommand,
  SettingsCommand,
  VerifyCommand,
  ViewMembersCommand,
} from './commands/index.js';
import { Constants } from './constants.js';
import {
  DebugEventHandler,
  ErrorEventHandler,
  GuildCreateEventHandler,
  GuildUpdateEventHandler,
  InteractionCreateEventHandler,
  ReadyEventHandler,
  RoleUpdateEventHandler,
  WarnEventHandler,
} from './event-handlers/index.js';
import { httpServer } from './http.js';
import { Bot } from './structures/bot.js';
import { Env } from './utils/env.js';
import { registerProcessEventListeners } from './utils/events.js';
import { logger } from './utils/logger.js';

await initI18n({ debug: Env.NODE_ENV === 'development' });

registerProcessEventListeners(logger, httpServer);

console.log('after reg...');

const eventHandlers = [
  new DebugEventHandler(),
  new ErrorEventHandler(),
  new GuildCreateEventHandler(),
  new GuildUpdateEventHandler(),
  new InteractionCreateEventHandler(),
  new ReadyEventHandler(),
  new RoleUpdateEventHandler(),
  new WarnEventHandler(),
];

const chatInputCommands = [
  new AddMemberCommand(),
  new AddRoleCommand(),
  new BroadcastCommand(),
  new CheckMemberCommand(),
  new DeleteMemberCommand(),
  new DeleteRoleCommand(),
  new HelpCommand(),
  new PingCommand(),
  new SetLanguageCommand(),
  new SetLogChannelCommand(),
  new SettingsCommand(),
  new VerifyCommand(),
  new ViewMembersCommand(),
];

const buttons = [
  new MembershipAcceptButton(),
  new MembershipModifyButton(),
  new MembershipRejectButton(),
];

console.log('Starting bot...');

export const bot = new Bot({
  options: { intents: Constants.intents },
  logger,
  eventHandlers,
  chatInputCommands,
  buttons,
});

console.log('before Connected to MongoDB');
await mongoose.connect(Env.MONGO_URI);
logger.debug('Connected to MongoDB');
console.log('after Connected to MongoDB');

await bot.start(Env.DISCORD_BOT_TOKEN);

httpServer.listen(Env.PORT);
