import { GoogleOAuth } from '@divine-bridge/common';
import 'server-only';

import { publicEnv } from '../common/public-env';
import { privateEnv } from './private-env';

export const googleOAuth = new GoogleOAuth(
  publicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  privateEnv.GOOGLE_CLIENT_SECRET,
);
