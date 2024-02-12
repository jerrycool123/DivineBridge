import { OCRTypes } from '../types.js';

export class JpnBillingDateParser implements OCRTypes.BillingDateParser {
  constructor(public readonly language: 'jpn') {}
  parse(lines: string[]): OCRTypes.RecognizedDate {
    const regex = /次回請求日:(\d{4})\/(\d{2})\/(\d{2})/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const [year, month, day] = match.slice(1, 4).map((s) => parseInt(s, 10));
        return { year, month, day };
      }
    }
    return OCRTypes.BillingDateParser.emptyDate;
  }
}
