import { CryptoUtils } from '@divine-bridge/common';
import 'server-only';

import { privateEnv } from './private-env';

export const cryptoUtils = new CryptoUtils(privateEnv.DATA_ENCRYPTION_KEY);
