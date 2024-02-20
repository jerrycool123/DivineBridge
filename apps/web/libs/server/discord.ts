import { DiscordBotAPI } from '@divine-bridge/common';
import 'server-only';

import { privateEnv } from './private-env';

export const discordBotApi = new DiscordBotAPI(privateEnv.DISCORD_BOT_TOKEN);
