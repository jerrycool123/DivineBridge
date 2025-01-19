import 'dotenv/config';
import { z } from 'zod';

export const Env = z
  .object({
    NODE_ENV: z.string(),
    PORT: z.string(),
    MONGO_URI: z.string(),
    DISCORD_BOT_TOKEN: z.string(),
    DEV_TEAM_DISCORD_GUILD_ID: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_API_KEY: z.string(),
    DATA_ENCRYPTION_KEY: z.string(),
    LOGGER_URI: z.string(),
  })
  .parse(process.env);
