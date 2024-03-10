import { z } from 'zod';

export const Env = z
  .object({
    NODE_ENV: z.string(),
    MONGO_URI: z.string(),
    API_TOKEN: z.string(),
    DISCORD_BOT_TOKEN: z.string(),
    DATA_ENCRYPTION_KEY: z.string(),
    GOOGLE_API_KEY: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    LOGGER_URI: z.string(),
  })
  .parse(process.env);
