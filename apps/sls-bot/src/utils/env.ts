import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string(),
  API_TOKEN: z.string(),
  DISCORD_CLIENT_PUBLIC_KEY: z.string(),
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_CLIENT_SECRET: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
});

export const Env = envSchema.parse(process.env);
