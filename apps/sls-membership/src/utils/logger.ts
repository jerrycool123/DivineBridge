import { SystemLogService } from '@divine-bridge/common';

import { Env } from './env.js';

export const checkScreenshotMembershipLogger = new SystemLogService(
  Env.LOGGER_URI,
  'check-screenshot-membership',
).instance;

export const checkAuthMembershipLogger = new SystemLogService(
  Env.LOGGER_URI,
  'check-auth-membership',
).instance;

export const updateMemberOnlyVideosLogger = new SystemLogService(
  Env.LOGGER_URI,
  'update-member-only-videos',
).instance;
