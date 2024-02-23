import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class DeuBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'deu') {}
  parse(lines: string[]): RecognizedDate {
    const regex = /NächstesAbrechnungsdatum:(\d{1,2})\.(\d{1,2})\.(\d{4})/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const [day, month, year] = match.slice(1, 4).map((s) => parseInt(s, 10));
        return { year, month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
