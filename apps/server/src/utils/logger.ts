import { SystemLogService } from '@divine-bridge/common';

import { Env } from './env.js';

export const logger = new SystemLogService(Env.LOGGER_URI, 'server').instance;
