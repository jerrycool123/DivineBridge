import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class EngBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'eng') {}
  parse(lines: string[]): RecognizedDate {
    const regex =
      /Nextbillingdate:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\d{1,2}),(\d{4})/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
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
        const [day, year] = match.slice(2, 4).map((s) => parseInt(s, 10));
        return { year, month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
