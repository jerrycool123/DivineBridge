import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class EngBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'eng') {}
  parse(lines: string[]): RecognizedDate {
    const regex = /Nextbillingdate:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\d{1,2})/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const day = parseInt(match[2], 10);
        const abbreviatedMonth = match[1];
        const monthMap: Record<string, number> = {
          Jan: 1,
          Feb: 2,
          Mar: 3,
          Apr: 4,
          May: 5,
          Jun: 6,
          Jul: 7,
          Aug: 8,
          Sep: 9,
          Oct: 10,
          Nov: 11,
          Dec: 12,
        };
        const month = monthMap[abbreviatedMonth];
        return { month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
