/* eslint-disable turbo/no-undeclared-env-vars */
import { z } from 'zod';

export const publicEnv = z
  .object({
    NEXT_PUBLIC_WEB_URL: z.string(),
    NEXT_PUBLIC_DISCORD_CLIENT_ID: z.string(),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string(),
  })
  .parse({
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
    NEXT_PUBLIC_DISCORD_CLIENT_ID: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });
