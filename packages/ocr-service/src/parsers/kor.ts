import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class KorBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'kor') {}
  parse(lines: string[]): RecognizedDate {
    const regex = /다음결제일:(\d{4})\.(\d{1,2})\.(\d{1,2})\./;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const [year, month, day] = match.slice(1, 4).map((s) => parseInt(s, 10));
        return { year, month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
