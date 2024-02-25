import {
  MembershipAcceptButton,
  MembershipModifyButton,
  MembershipRejectButton,
} from './buttons/index.js';
import {
  AddMemberCommand,
  AddRoleCommand,
  AddYouTubeChannelCommand,
  CheckMemberCommand,
  DeleteMemberCommand,
  DeleteRoleCommand,
  PingCommand,
  SetLogChannelCommand,
  SettingsCommand,
  VerifyCommand,
  ViewMembersCommand,
} from './commands/index.js';
import { Constants } from './constants.js';
import {
  GuildCreateEventHandler,
  GuildUpdateEventHandler,
  InteractionCreateEventHandler,
  ReadyEventHandler,
  RoleUpdateEventHandler,
} from './event-handlers/index.js';
import { Bot } from './structures/bot.js';
import { logger } from './utils/logger.js';

export const eventHandlers = [
  GuildCreateEventHandler,
  GuildUpdateEventHandler,
  InteractionCreateEventHandler,
  ReadyEventHandler,
  RoleUpdateEventHandler,
];
export type EventHandlers = typeof eventHandlers;

export const chatInputCommands = [
  AddMemberCommand,
  AddRoleCommand,
  AddYouTubeChannelCommand,
  CheckMemberCommand,
  DeleteMemberCommand,
  DeleteRoleCommand,
  PingCommand,
  SetLogChannelCommand,
  SettingsCommand,
  VerifyCommand,
  ViewMembersCommand,
];
export type ChatInputCommands = typeof chatInputCommands;

export const buttons = [MembershipAcceptButton, MembershipModifyButton, MembershipRejectButton];
export type Buttons = typeof buttons;

export const bot = new Bot({
  options: { intents: Constants.intents },
  logger,
  eventHandlers,
  chatInputCommands,
  buttons,
});
