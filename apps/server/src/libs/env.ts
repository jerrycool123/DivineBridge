import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string(),
  PORT: z.string(),
  MONGO_URL: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
  DISCORD_BOT_CLIENT_ID: z.string(),
  DISCORD_BOT_CLIENT_SECRET: z.string(),
});
const parsedEnv = envSchema.safeParse(process.env);
if (parsedEnv.success === false) {
  console.error(parsedEnv.error.stack);
  process.exit(1);
}

const Env = parsedEnv.data;

export default Env;
