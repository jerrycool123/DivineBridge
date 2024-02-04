// src/index.ts
import { LogLevel, SapphireClient, container } from '@sapphire/framework';
// src/plugins.ts
import '@sapphire/plugin-api/register';
import '@sapphire/plugin-logger/register';
import { GatewayIntentBits } from 'discord.js';
// src/libs/env.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import { z } from 'zod';

var envSchema = z.object({
  NODE_ENV: z.string(),
  PORT: z.string(),
  MONGO_URL: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
  DISCORD_BOT_CLIENT_ID: z.string(),
  DISCORD_BOT_CLIENT_SECRET: z.string(),
});
var parsedEnv = envSchema.safeParse(process.env);
if (parsedEnv.success === false) {
  console.error(parsedEnv.error.stack);
  process.exit(1);
}
var Env = parsedEnv.data;
var env_default = Env;

// src/index.ts
var clientOptions = {
  intents: [GatewayIntentBits.Guilds],
  loadMessageCommandListeners: true,
  api: {
    prefix: '/server',
    listenOptions: {
      port: parseInt(env_default.PORT, 10),
    },
  },
  logger: {
    level: env_default.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Info,
  },
};
var client = new SapphireClient(clientOptions);
await mongoose.connect(env_default.MONGO_URL);
container.logger.info('Connected to MongoDB');
await client.login(env_default.DISCORD_BOT_TOKEN);
