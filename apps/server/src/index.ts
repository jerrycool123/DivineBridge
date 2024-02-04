import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import { ClientOptions, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';

import Env from './libs/env.js';
import './plugins.js';

const clientOptions: ClientOptions = {
  intents: [GatewayIntentBits.Guilds],
  loadMessageCommandListeners: true,
  api: {
    prefix: '/server',
    listenOptions: {
      port: parseInt(Env.PORT, 10),
    },
  },
  logger: {
    level: Env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Info,
  },
};

const client = new SapphireClient(clientOptions);

await mongoose.connect(Env.MONGO_URL);
container.logger.info('Connected to MongoDB');

await client.login(Env.DISCORD_BOT_TOKEN);
