import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class KorBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'kor') {}
  parse(lines: string[]): RecognizedDate {
    const regex = /다음결제일:(\d{1,2})월(\d{1,2})일/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const [month, day] = match.slice(1, 3).map((s) => parseInt(s, 10));
        return { month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
