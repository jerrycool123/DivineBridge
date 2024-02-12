import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import { ApiRequest, ApiResponse } from '@sapphire/plugin-api';
import { ClientOptions, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';

import { loadMiddlewares } from './middlewares/_load.js';
import './plugins.js';
import { Env } from './utils/env.js';

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

loadMiddlewares();

await mongoose.connect(Env.MONGO_URI);
container.logger.info('Connected to MongoDB');

await client.login(Env.DISCORD_BOT_TOKEN);

container.server.on('request', (request: ApiRequest, _response: ApiResponse) => {
  container.logger.debug(`${request.method} ${request.url}`);
  container.logger.debug(request.headers);
  container.logger.debug(request.body);
});
