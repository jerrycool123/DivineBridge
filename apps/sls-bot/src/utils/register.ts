import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import { commands } from '../application-commands/index.js';
import { Env } from './env.js';

export const registerGlobalCommands = async () => {
  try {
    const rest = new REST({ version: '10' });
    rest.setToken(Env.DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationCommands(Env.DISCORD_CLIENT_ID), {
      body: commands.map(({ data }) => data),
    });
    return true;
  } catch (error) {
    console.error(error);
  }
  return false;
};
