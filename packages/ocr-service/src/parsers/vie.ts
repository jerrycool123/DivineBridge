import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class VieBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'vie') {}
  parse(lines: string[]): RecognizedDate {
    const regex = /Ngàythanhtoántiếptheo:(\d{1,2})thg(\d{1,2})/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const [day, month] = match.slice(1, 3).map((s) => parseInt(s, 10));
        return { month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
