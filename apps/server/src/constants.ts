import { LogLevel } from '@divine-bridge/common';
import { BitFieldResolvable, GatewayIntentBits, GatewayIntentsString } from 'discord.js';

import { Env } from './utils/env.js';

export namespace Constants {
  export const intents: BitFieldResolvable<GatewayIntentsString, number> = [
    GatewayIntentBits.Guilds,
  ];

  export const logLevel: LogLevel = Env.NODE_ENV === 'production' ? 'info' : 'debug';

  export const membership = {
    accept: 'membership-accept',
    reject: 'membership-reject',
    modify: 'membership-modify',
  } as const;

  export const colors = {
    success: '#57F287',
    error: '#ED4245',
    request: '#1DA0F2',
    modified: '#FEE75C',
  } as const;
}
