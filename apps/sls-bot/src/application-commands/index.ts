import { APIApplicationCommandInteraction, APIInteractionResponse } from 'discord-api-types/v10';

import { errorInteractionResponse } from '../utils/error.js';
import { PingCommand } from './ping.js';
import { ApplicationCommand } from './types.js';

export const commands: ApplicationCommand[] = [PingCommand];

export const applicationCommandHandler = async (
  message: APIApplicationCommandInteraction,
): Promise<APIInteractionResponse> => {
  const command = commands.find((cmd) => cmd.data.name === message.data.name);
  console.log('command', command?.data.name);
  if (command !== undefined) {
    try {
      return command.execute();
    } catch (error) {
      console.error(error);
    }
  }
  return errorInteractionResponse;
};
