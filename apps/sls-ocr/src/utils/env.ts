import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string(),
  API_TOKEN: z.string(),
});

export const Env = envSchema.parse(process.env);
