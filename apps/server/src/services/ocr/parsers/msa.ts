import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class MsaBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'msa') {}
  parse(lines: string[]): RecognizedDate {
    const regex =
      /Tarikhpengebilanseterusnya:(\d{1,2})(Jan|Feb|Mac|Apr|Mei|Jun|Jul|Ogos|Sep|Okt|Nov|Dis)/;
    for (const line of lines) {
      const match = regex.exec(line);
      if (match !== null) {
        const day = parseInt(match[1], 10);
        const abbreviatedMonth = match[2];
        const monthMap: Record<string, number> = {
          Jan: 1,
          Feb: 2,
          Mac: 3,
          Apr: 4,
          Mei: 5,
          Jun: 6,
          Jul: 7,
          Ogos: 8,
          Sep: 9,
          Okt: 10,
          Nov: 11,
          Dis: 12,
        };
        const month = monthMap[abbreviatedMonth];
        return { month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
