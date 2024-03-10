import type { Logger } from '@divine-bridge/common';
import mongoose from 'mongoose';

import { Env } from './env.js';

export const dbConnect = async (logger: Logger) => {
  await mongoose.connect(Env.MONGO_URI);
  logger.debug('Connected to MongoDB');
};
