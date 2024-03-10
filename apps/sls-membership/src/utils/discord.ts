import { DiscordBotAPI } from '@divine-bridge/common';

import { Env } from './env.js';

export const discordBotApi = new DiscordBotAPI(Env.DISCORD_BOT_TOKEN);
