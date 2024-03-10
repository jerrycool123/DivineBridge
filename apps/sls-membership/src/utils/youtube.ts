import { YouTubeApiKeyAPI } from '@divine-bridge/common';

import { Env } from './env.js';

export const youtubeApiKeyApi = new YouTubeApiKeyAPI(Env.GOOGLE_API_KEY);
