import { z } from 'zod';

export const Env = z
  .object({
    NODE_ENV: z.string(),
    API_TOKEN: z.string(),
    LOGGER_URI: z.string(),
  })
  .parse(process.env);
