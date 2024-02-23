import { SystemLogService } from '@divine-bridge/common';
import 'server-only';

import { privateEnv } from './private-env';

export const logger = new SystemLogService(privateEnv.LOGGER_URI, 'web').instance;
