import { SlashCommandBuilder } from '@discordjs/builders';
import {
  APIInteractionResponse,
  InteractionResponseType,
  MessageFlags,
} from 'discord-api-types/v10';

import { ApplicationCommand } from './types.js';

export const PingCommand: ApplicationCommand = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
  async execute() {
    const res: APIInteractionResponse = {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        flags: MessageFlags.Ephemeral,
        content: 'Pong!',
      },
    };
    return res;
  },
};
