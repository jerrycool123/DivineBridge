import { container } from '@sapphire/framework';
import axios from 'axios';
import { z } from 'zod';

import { Env } from '../../utils/env.js';
import { OCRConstants } from './constants.js';
import { OCRTypes } from './types.js';

export namespace OCRService {
  export const recognizeBillingDate = async (
    imageUrl: string,
    langCode: OCRConstants.TSupportedLangCode,
  ): Promise<OCRTypes.RecognizedDate> => {
    const apiSchema = z.object({
      message: z.string(),
    });
    try {
      const { data } = await axios.post<z.infer<typeof apiSchema>>(
        `${Env.OCR_API_ENDPOINT}/api/ocr`,
        {
          image: imageUrl,
          language: langCode,
        },
        {
          headers: {
            Authorization: `Bearer ${Env.OCR_API_KEY}`,
          },
        },
      );
      const parsedData = apiSchema.safeParse(data);
      if (!parsedData.success) {
        return OCRTypes.BillingDateParser.emptyDate;
      }
      const rawText = parsedData.data.message;
      const parsedDateResult = parseDate(rawText, langCode);
      if (parsedDateResult.success) {
        return parsedDateResult.date;
      }
    } catch (error) {
      container.logger.error(error);
    }
    return OCRTypes.BillingDateParser.emptyDate;
  };

  export const parseDate = (
    rawText: string,
    langCode: OCRConstants.TSupportedLangCode,
  ):
    | {
        success: false;
        error: string;
      }
    | {
        success: true;
        date: OCRTypes.RecognizedDate;
      } => {
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

    const parser = OCRConstants.billingDateParsers.find((p) => p.language === langCode);
    if (parser === undefined) {
      return {
        success: false,
        error: 'Unsupported language',
      };
    }
    const date = parser.parse(lines);

    return {
      success: true,
      date,
    };
  };
}
