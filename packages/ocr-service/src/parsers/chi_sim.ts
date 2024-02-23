import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class ChiSimBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'chi_sim') {}
  parse(lines: string[]): RecognizedDate {
    const regex = /结算日期:(\d{4})年(\d{1,2})月(\d{1,2})日/;
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
