/* eslint-disable turbo/no-undeclared-env-vars */
import 'server-only';
import { z } from 'zod';

export const privateEnv = z
  .object({
    NODE_ENV: z.string(),
    AUTH_SECRET: z.string(),
    AUTH_URL: z.string(),
    AUTH_DISCORD_ID: z.string(),
    AUTH_DISCORD_SECRET: z.string(),
    MONGO_URI: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    DATA_ENCRYPTION_KEY: z.string(),
    DISCORD_BOT_TOKEN: z.string(),
    LOGGER_URI: z.string(),
  })
  .parse({
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET ?? '',
    AUTH_URL: process.env.AUTH_URL ?? '',
    AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID ?? '',
    AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET ?? '',
    MONGO_URI: process.env.MONGO_URI ?? '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
    DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY ?? '',
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ?? '',
    LOGGER_URI: process.env.LOGGER_URI ?? '',
  });
