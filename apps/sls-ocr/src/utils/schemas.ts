import { supportedOCRLanguages } from '@divine-bridge/ocr-service';
import { z } from 'zod';

const [language, language2, ...languages] = supportedOCRLanguages.map(({ code }) =>
  z.literal(code),
);

export const ocrBodySchema = z.object({
  image: z.string(),
  language: z.union([language, language2, ...languages]),
});
