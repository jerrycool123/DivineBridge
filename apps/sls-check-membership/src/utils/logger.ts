import { SystemLogService } from '@divine-bridge/common';

import { Env } from './env.js';

export const checkScreenshotMembershipLogger = new SystemLogService(
  Env.LOGGER_URI,
  'check-screenshot-membership',
).instance;

export const checkAuthMembershipLogger = new SystemLogService(Env.LOGGER_URI, 'check-membership')
  .instance;
