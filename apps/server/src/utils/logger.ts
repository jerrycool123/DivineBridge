import { SystemLogService } from '@divine-bridge/common';

import { Constants } from '../constants.js';
import { Env } from './env.js';

export const logger = new SystemLogService(Env.LOGGER_URI, 'server', Constants.logLevel).instance;
