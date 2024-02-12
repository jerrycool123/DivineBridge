/* eslint-disable turbo/no-undeclared-env-vars */
import 'server-only';
import { z } from 'zod';

export const privateEnv = z
  .object({
    NODE_ENV: z.string(),
    AUTH_SECRET: z.string(),
    AUTH_URL: z.string(),
    SERVER_URL: z.string(),
    AUTH_DISCORD_ID: z.string(),
    AUTH_DISCORD_SECRET: z.string(),
  })
  .parse({
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    SERVER_URL: process.env.SERVER_URL,
    AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
    AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
  });
