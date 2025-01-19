import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class DeuBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'deu') {}
  parse(lines: string[]): RecognizedDate {
    const regex =
      /NächstesAbrechnungsdatum:(\d{1,2})\.(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/;
    for (const line of lines) {
      const match = regex.exec(line);
      if (match !== null) {
        const day = parseInt(match[1], 10);
        const fullMonth = match[2];
        const monthMap: Record<string, number> = {
          Januar: 1,
          Februar: 2,
          März: 3,
          April: 4,
          Mai: 5,
          Juni: 6,
          Juli: 7,
          August: 8,
          September: 9,
          Oktober: 10,
          November: 11,
          Dezember: 12,
        };
        const month = monthMap[fullMonth];
        return { month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
