import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class FilBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'fil') {}
  parse(lines: string[]): RecognizedDate {
    const regex =
      /Susunodnapetsangpagsingil:(Ene|Peb|Mar|Abr|Mayo|Hun|Hul|Ago|Set|Okt|Nob|Dis)(\d{1,2})/g;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const day = parseInt(match[2], 10);
        const abbreviatedMonth = match[1];
        const monthMap: Record<string, number> = {
          Ene: 1,
          Peb: 2,
          Mar: 3,
          Abr: 4,
          Mayo: 5,
          Hun: 6,
          Hul: 7,
          Ago: 8,
          Set: 9,
          Okt: 10,
          Nob: 11,
          Dis: 12,
        };
        const month = monthMap[abbreviatedMonth];
        return { month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
