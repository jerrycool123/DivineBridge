import { GoogleOAuth } from '@divine-bridge/common';

import { Env } from './env.js';

export const googleOAuth = new GoogleOAuth(Env.GOOGLE_CLIENT_ID, Env.GOOGLE_CLIENT_SECRET);
