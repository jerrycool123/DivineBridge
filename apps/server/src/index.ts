import mongoose from 'mongoose';

import { bot } from './bot.js';
import { httpServer } from './http.js';
import { Env } from './utils/env.js';
import { registerProcessHandlers } from './utils/events.js';
import { logger } from './utils/logger.js';

registerProcessHandlers(logger, httpServer);

await mongoose.connect(Env.MONGO_URI);
logger.debug('Connected to MongoDB');

await bot.start(Env.DISCORD_BOT_TOKEN);

httpServer.listen(Env.PORT);
