import { SystemLogService } from '@divine-bridge/common';

import { Env } from './env.js';

export const logger = new SystemLogService(
  Env.LOGGER_URI,
  'ocr',
  Env.NODE_ENV === 'development' ? 'debug' : 'info',
).instance;
