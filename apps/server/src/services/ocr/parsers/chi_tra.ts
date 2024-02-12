import { OCRTypes } from '../types.js';

export class ChiTraBillingDateParser implements OCRTypes.BillingDateParser {
  constructor(public readonly language: 'chi_tra') {}
  parse(lines: string[]): OCRTypes.RecognizedDate {
    const regex = /帳單日期:(\d{4})年(\d{1,2})月(\d{1,2})日/;
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
