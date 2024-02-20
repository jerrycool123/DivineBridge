import { CryptoUtils } from '@divine-bridge/common';

import { Env } from './env.js';

export const cryptoUtils = new CryptoUtils(Env.DATA_ENCRYPTION_KEY);
