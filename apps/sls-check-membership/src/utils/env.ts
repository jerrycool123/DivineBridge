import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string(),
  MONGO_URI: z.string(),
  API_TOKEN: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
  DISCORD_LOG_WEBHOOK_URL: z.string(),
  DATA_ENCRYPTION_KEY: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
});

export const Env = envSchema.parse(process.env);
