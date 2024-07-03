import { z } from 'zod';

import { BillingDateParser, RecognizedDate, recognizedDateSchema } from './definitions.js';
import { type TSupportedLangCode, billingDateParsers } from './parsers.js';

export { supportedOCRLanguages } from './parsers.js';
export type { RecognizedDate } from './definitions.js';

export class OCRService {
  private readonly apiResponseSchema = z.object({
    message: z.string(),
  });

  constructor(
    private readonly apiEndpoint: string,
    private readonly apiKey: string,
  ) {}

  public async recognizeBillingDate(
    imageUrl: string,
    langCode: TSupportedLangCode,
  ): Promise<
    | { success: true; date: RecognizedDate }
    | {
        success: false;
        error: string;
      }
  > {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          image: imageUrl,
          language: langCode,
        }),
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      const data = (await response.json()) as unknown;

      if (!response.ok) {
        return {
          success: false,
          error: JSON.stringify(data),
        };
      }

      const parsedData = this.apiResponseSchema.safeParse(data);
      if (parsedData.success) {
        const { message: rawText } = parsedData.data;
        const parsedDateResult = this.parseDate(rawText, langCode);
        return parsedDateResult.success
          ? parsedDateResult
          : { success: false, error: parsedDateResult.error };
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }
    return {
      success: false,
      error: 'Unknown error',
    };
  }

  private parseDate(
    rawText: string,
    langCode: TSupportedLangCode,
  ):
    | {
        success: false;
        error: string;
      }
    | {
        success: true;
        date: RecognizedDate;
      } {
    let text = rawText;

    /**
     * post-process raw text
     */

    // replace full-width characters with half-width characters
    text = text.replace(/[\uff01-\uff5e]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
    // replace small form variant colon
    text = text.replace(/\ufe55/g, ':');
    // replace enclosed alphanumeric characters with their corresponding numbers
    text = text.replace(/[\u2460-\u2468]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x245f));
    text = text.replace(/[\u2469-\u2473]/g, (c) => (c.charCodeAt(0) - 0x245f).toString());
    // replace spaces with empty string
    const lines = text.split('\n').map((line) => line.replace(/\s/g, ''));

    /**
     * i18n date parser
     */

    const parser = Object.values(billingDateParsers).find(({ code }) => code === langCode);
    if (parser === undefined) {
      return {
        success: false,
        error: 'Unsupported language',
      };
    }
    const rawDate = parser.parse(lines);
    const parsedDate = recognizedDateSchema.safeParse(rawDate);
    const date = parsedDate.success ? parsedDate.data : BillingDateParser.emptyDate;

    return { success: true, date };
  }
}
