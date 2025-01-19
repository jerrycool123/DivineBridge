import { z } from 'zod';

export const recognizedDateSchema = z.union([
  z.object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  }),
  z.object({
    month: z.null(),
    day: z.null(),
  }),
]);

export type RecognizedDate = z.infer<typeof recognizedDateSchema>;
