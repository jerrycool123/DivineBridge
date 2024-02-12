import { OCRTypes } from '../types.js';

export class VieBillingDateParser implements OCRTypes.BillingDateParser {
  constructor(public readonly language: 'vie') {}
  parse(lines: string[]): OCRTypes.RecognizedDate {
    const regex = /Ngàythanhtoántiếptheo:(\d{1,2})thg(\d{1,2}),(\d{4})/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const [day, month, year] = match.slice(1, 4).map((s) => parseInt(s, 10));
        return { year, month, day };
      }
    }
    return OCRTypes.BillingDateParser.emptyDate;
  }
}
