import { z } from 'zod';

export const errorDataSchema = z.object({
  message: z.string(),
});
