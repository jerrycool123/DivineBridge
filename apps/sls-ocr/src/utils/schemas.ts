import { z } from 'zod';

export const ocrBodySchema = z.object({
  image: z.string(),
  language: z.union([
    z.literal('chi_sim'),
    z.literal('chi_tra'),
    z.literal('deu'),
    z.literal('eng'),
    z.literal('fil'),
    z.literal('ind'),
    z.literal('jpn'),
    z.literal('kor'),
    z.literal('msa'),
    z.literal('tha'),
    z.literal('vie'),
  ]),
});
