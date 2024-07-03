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

export abstract class BillingDateParser {
  public static readonly emptyDate: RecognizedDate = { month: null, day: null };

  constructor(public readonly code: string) {}

  public abstract parse(lines: string[]): RecognizedDate;
}
