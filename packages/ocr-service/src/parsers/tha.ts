import type { RecognizedDate } from '../definitions.js';
import { BillingDateParser } from '../definitions.js';

export class ThaBillingDateParser implements BillingDateParser {
  constructor(public readonly code: 'tha') {}
  parse(lines: string[]): RecognizedDate {
    const regex =
      /เรียกเก็บเงินครั้งถัดไปในวันที่(\d{1,2})(ม.ค.|ก.พ.|มี.ค.|เม.ย.|พ.ค.|มิ.ย.|ก.ค.|ส.ค.|ก.ย.|ต.ค.|พ.ย.|ธ.ค.)/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const day = parseInt(match[1], 10);
        const abbreviatedMonth = match[2];
        const monthMap: Record<string, number> = {
          'ม.ค.': 1,
          'ก.พ.': 2,
          'มี.ค.': 3,
          'เม.ย.': 4,
          'พ.ค.': 5,
          'มิ.ย.': 6,
          'ก.ค.': 7,
          'ส.ค.': 8,
          'ก.ย.': 9,
          'ต.ค.': 10,
          'พ.ย.': 11,
          'ธ.ค.': 12,
        };
        const month = monthMap[abbreviatedMonth];
        return { month, day };
      }
    }
    return BillingDateParser.emptyDate;
  }
}
